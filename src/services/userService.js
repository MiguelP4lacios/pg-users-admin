const db = require('./db');

// List all users (excluding system users by default)
const listUsers = async (includeSystemUsers = false) => {
  try {
    let query = `SELECT rolname as username, rolsuper as is_superuser, 
       rolcreaterole as can_create_role, rolcanlogin as can_login 
       FROM pg_roles 
       WHERE rolcanlogin = true`;
    
    // Excluir usuarios del sistema a menos que explícitamente se soliciten
    if (!includeSystemUsers) {
      query += ` AND rolname NOT LIKE 'pg\\_%' AND rolname NOT LIKE 'rds\\_%'`;
    }
    
    query += ` ORDER BY rolname;`;
    
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error('Error listing users:', err.message);
    throw err;
  }
};

// Create a new user
const createUser = async (username, password) => {
  try {
    // Validar que el nombre no comience con prefijos reservados
    if (username.startsWith('pg_') || username.startsWith('rds_')) {
      return { 
        success: false, 
        message: `Error: Cannot create user with reserved prefix (pg_ or rds_). These are reserved for system use.` 
      };
    }
    
    await db.query(`CREATE ROLE ${username} WITH LOGIN PASSWORD '${password}';`);
    return { success: true, message: `User ${username} created successfully` };
  } catch (err) {
    console.error('Error creating user:', err.message);
    throw err;
  }
};

// Update user password
const updateUserPassword = async (username, newPassword) => {
  try {
    // Prevenir cambios en usuarios del sistema
    if (username.startsWith('pg_') || username.startsWith('rds_')) {
      return { 
        success: false, 
        message: `Error: Cannot modify system user ${username}. System users are protected.` 
      };
    }
    
    await db.query(`ALTER ROLE ${username} WITH PASSWORD '${newPassword}';`);
    return { success: true, message: `Password for ${username} updated successfully` };
  } catch (err) {
    console.error('Error updating user password:', err.message);
    throw err;
  }
};

// Delete a user
const deleteUser = async (username) => {
  try {
    // Prevenir eliminación de usuarios del sistema
    if (username.startsWith('pg_') || username.startsWith('rds_')) {
      return { 
        success: false, 
        message: `Error: Cannot delete system user ${username}. System users are protected.` 
      };
    }
    
    await db.query(`DROP ROLE ${username};`);
    return { success: true, message: `User ${username} deleted successfully` };
  } catch (err) {
    console.error('Error deleting user:', err.message);
    throw err;
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUserPassword,
  deleteUser
}; 