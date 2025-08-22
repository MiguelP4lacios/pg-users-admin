const db = require('./db');

// List all roles (excluding system roles)
const listRoles = async (includeSystemRoles = false) => {
  try {
    let query = `
      SELECT rolname as rolename, rolsuper as is_superuser, 
       rolcreaterole as can_create_role, rolcanlogin as can_login 
       FROM pg_roles 
       WHERE rolcanlogin = false`;
       
    // Excluir roles del sistema a menos que explícitamente se soliciten
    if (!includeSystemRoles) {
      query += ` AND rolname NOT LIKE 'pg\\_%' AND rolname NOT LIKE 'rds\\_%'`;
    }
    
    query += ` ORDER BY rolname;`;
    
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error('Error listing roles:', err.message);
    throw err;
  }
};

// List roles for a specific user
const listUserRoles = async (username) => {
  try {
    const result = await db.query(
      `SELECT r.rolname as rolename,
              r.rolsuper as is_superuser,
              r.rolcreaterole as can_create_role
       FROM pg_roles r
       JOIN pg_auth_members m ON m.roleid = r.oid
       JOIN pg_roles u ON m.member = u.oid
       WHERE u.rolname = $1
       ORDER BY r.rolname;`,
      [username]
    );
    return result.rows;
  } catch (err) {
    console.error('Error listing user roles:', err.message);
    throw err;
  }
};

// Create a new role
const createRole = async (rolename) => {
  try {
    // Validar que el nombre no comience con prefijos reservados
    if (rolename.startsWith('pg_') || rolename.startsWith('rds_')) {
      return { 
        success: false, 
        message: `Error: Cannot create role with reserved prefix (pg_ or rds_). These are reserved for system use.` 
      };
    }

    await db.query(`CREATE ROLE ${rolename} NOLOGIN;`);
    return { success: true, message: `Role ${rolename} created successfully` };
  } catch (err) {
    console.error('Error creating role:', err.message);
    throw err;
  }
};

// Delete a role
const deleteRole = async (rolename) => {
  try {
    // Prevenir eliminación de roles del sistema
    if (rolename.startsWith('pg_') || rolename.startsWith('rds_')) {
      return { 
        success: false, 
        message: `Error: Cannot delete system role ${rolename}. System roles are protected.` 
      };
    }

    await db.query(`DROP ROLE ${rolename};`);
    return { success: true, message: `Role ${rolename} deleted successfully` };
  } catch (err) {
    console.error('Error deleting role:', err.message);
    throw err;
  }
};

// Assign a user to a role
const assignUserToRole = async (username, rolename) => {
  try {
    await db.query(`GRANT ${rolename} TO ${username};`);
    return { success: true, message: `User ${username} assigned to role ${rolename} successfully` };
  } catch (err) {
    console.error('Error assigning user to role:', err.message);
    throw err;
  }
};

// Remove a user from a role
const removeUserFromRole = async (username, rolename) => {
  try {
    await db.query(`REVOKE ${rolename} FROM ${username};`);
    return { success: true, message: `User ${username} removed from role ${rolename} successfully` };
  } catch (err) {
    console.error('Error removing user from role:', err.message);
    throw err;
  }
};

module.exports = {
  listRoles,
  listUserRoles,
  createRole,
  deleteRole,
  assignUserToRole,
  removeUserFromRole
}; 