const db = require('./db');

// List all schemas in a database (excluding system schemas)
const listSchemas = async (includeSystemSchemas = false) => {
  try {
    let query = `
      SELECT nspname as schema_name
      FROM pg_namespace
      WHERE nspname NOT LIKE 'pg\\_%' AND nspname != 'information_schema'
      ORDER BY nspname;
    `;
    
    // If system schemas should be included, adjust the query
    if (includeSystemSchemas) {
      query = `
        SELECT nspname as schema_name
        FROM pg_namespace
        ORDER BY nspname;
      `;
    }
    
    const result = await db.query(query);
    return result.rows.map(row => row.schema_name);
  } catch (err) {
    console.error('Error listing schemas:', err.message);
    throw err;
  }
};

// Grant read permissions to a role for multiple schemas
const grantReadPermissionsMulti = async (rolename, database, schemas) => {
  try {
    // First grant connect to the database (only need to do once)
    await db.query(`GRANT CONNECT ON DATABASE ${database} TO ${rolename};`);
    
    // Array to store messages
    const messages = [];
    
    // Process each schema
    for (const schema of schemas) {
      await db.query(`GRANT USAGE ON SCHEMA ${schema} TO ${rolename};`);
      await db.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO ${rolename};`);
      await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT ON TABLES TO ${rolename};`);
      
      messages.push(`${schema}`);
    }
    
    return { 
      success: true, 
      message: `Read permissions granted to ${rolename} on ${database} schemas: ${messages.join(', ')}`
    };
  } catch (err) {
    console.error('Error granting read permissions to multiple schemas:', err.message);
    throw err;
  }
};

// Grant write permissions to a role for multiple schemas
const grantWritePermissionsMulti = async (rolename, database, schemas) => {
  try {
    // First grant read permissions to all schemas
    await grantReadPermissionsMulti(rolename, database, schemas);
    
    // Array to store messages
    const messages = [];
    
    // Process each schema for write permissions
    for (const schema of schemas) {
      // Add write permissions
      await db.query(`GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${rolename};`);
      await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${rolename};`);
      await db.query(`GRANT USAGE ON ALL SEQUENCES IN SCHEMA ${schema} TO ${rolename};`);
      await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT USAGE ON SEQUENCES TO ${rolename};`);
      
      messages.push(`${schema}`);
    }
    
    return { 
      success: true, 
      message: `Write permissions granted to ${rolename} on ${database} schemas: ${messages.join(', ')}`
    };
  } catch (err) {
    console.error('Error granting write permissions to multiple schemas:', err.message);
    throw err;
  }
};

// Grant read permissions to a role
const grantReadPermissions = async (rolename, database, schema = 'public') => {
  try {
    await db.query(`GRANT CONNECT ON DATABASE ${database} TO ${rolename};`);
    await db.query(`GRANT USAGE ON SCHEMA ${schema} TO ${rolename};`);
    await db.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO ${rolename};`);
    await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT ON TABLES TO ${rolename};`);
    
    return { 
      success: true, 
      message: `Read permissions granted to ${rolename} on ${database}.${schema}`
    };
  } catch (err) {
    console.error('Error granting read permissions:', err.message);
    throw err;
  }
};

// Grant write permissions to a role
const grantWritePermissions = async (rolename, database, schema = 'public') => {
  try {
    // First grant read permissions
    await grantReadPermissions(rolename, database, schema);
    
    // Add write permissions
    await db.query(`GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${rolename};`);
    await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${rolename};`);
    await db.query(`GRANT USAGE ON ALL SEQUENCES IN SCHEMA ${schema} TO ${rolename};`);
    await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT USAGE ON SEQUENCES TO ${rolename};`);
    
    return { 
      success: true, 
      message: `Write permissions granted to ${rolename} on ${database}.${schema}`
    };
  } catch (err) {
    console.error('Error granting write permissions:', err.message);
    throw err;
  }
};

// Revoke all permissions from a role for multiple schemas
const revokeAllPermissionsMulti = async (rolename, database, schemas) => {
  try {
    // Array to store messages
    const messages = [];
    
    // Process each schema
    for (const schema of schemas) {
      await db.query(`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} FROM ${rolename};`);
      await db.query(`REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} FROM ${rolename};`);
      await db.query(`REVOKE ALL PRIVILEGES ON SCHEMA ${schema} FROM ${rolename};`);
      await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} REVOKE ALL PRIVILEGES ON TABLES FROM ${rolename};`);
      await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} REVOKE ALL PRIVILEGES ON SEQUENCES FROM ${rolename};`);
      
      messages.push(`${schema}`);
    }
    
    // Finally revoke database privileges
    await db.query(`REVOKE ALL PRIVILEGES ON DATABASE ${database} FROM ${rolename};`);
    
    return { 
      success: true, 
      message: `All permissions revoked from ${rolename} on ${database} schemas: ${messages.join(', ')}`
    };
  } catch (err) {
    console.error('Error revoking permissions from multiple schemas:', err.message);
    throw err;
  }
};

// Revoke all permissions from a role
const revokeAllPermissions = async (rolename, database, schema = 'public') => {
  try {
    await db.query(`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} FROM ${rolename};`);
    await db.query(`REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} FROM ${rolename};`);
    await db.query(`REVOKE ALL PRIVILEGES ON SCHEMA ${schema} FROM ${rolename};`);
    await db.query(`REVOKE ALL PRIVILEGES ON DATABASE ${database} FROM ${rolename};`);
    
    await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} REVOKE ALL PRIVILEGES ON TABLES FROM ${rolename};`);
    await db.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} REVOKE ALL PRIVILEGES ON SEQUENCES FROM ${rolename};`);
    
    return { 
      success: true, 
      message: `All permissions revoked from ${rolename} on ${database}.${schema}`
    };
  } catch (err) {
    console.error('Error revoking permissions:', err.message);
    throw err;
  }
};

// List all permissions for a role (enhanced version)
const listPermissions = async (rolename) => {
  try {
    // Get basic role information
    const roleInfo = await db.query(`
      SELECT 
        rolname,
        rolsuper,
        rolinherit,
        rolcreaterole,
        rolcreatedb,
        rolcanlogin,
        rolreplication,
        rolconnlimit,
        rolvaliduntil
      FROM pg_roles
      WHERE rolname = $1;
    `, [rolename]);

    // Create a permissions object to hold all results
    const permissions = {
      roleDetails: roleInfo.rows[0] || {},
      tablePermissions: [],
      schemaPermissions: [],
      databasePermissions: [],
      columnPermissions: [],
      functionPermissions: [],
      defaultPrivileges: [],
      memberOf: [],
      description: null
    };


    // Get table permissions (standard info schema view)
    const tablePerms = await db.query(`
      SELECT table_catalog, table_schema, table_name, privilege_type
      FROM information_schema.table_privileges
      WHERE grantee = $1
      ORDER BY table_schema, table_name, privilege_type;
    `, [rolename]);
    
    permissions.tablePermissions = tablePerms.rows;

    // Get roles this role belongs to (role membership)
    const memberOf = await db.query(`
      SELECT r.rolname AS parent_role
      FROM pg_roles m
      JOIN pg_auth_members ON pg_auth_members.member = m.oid
      JOIN pg_roles r ON pg_auth_members.roleid = r.oid
      WHERE m.rolname = $1;
    `, [rolename]);
    
    permissions.memberOf = memberOf.rows;

    // Get column level permissions
    const columnPerms = await db.query(`
      SELECT table_catalog, table_schema, table_name, column_name, privilege_type
      FROM information_schema.column_privileges
      WHERE grantee = $1
      ORDER BY table_schema, table_name, column_name, privilege_type;
    `, [rolename]);
    
    permissions.columnPermissions = columnPerms.rows;

    
    // TODO: uncomment this when we have a way to get function permissions
    // // Get function permissions (for system roles, they often have function privileges)
    // const functionPerms = await db.query(`
    //   SELECT 
    //     n.nspname AS schema_name,
    //     p.proname AS function_name,
    //     pg_get_function_arguments(p.oid) AS argument_types,
    //     CASE
    //         WHEN has_function_privilege($1, p.oid, 'EXECUTE') THEN 'EXECUTE'
    //         ELSE NULL
    //       END AS privilege
    //     FROM pg_proc p
    //     JOIN pg_namespace n ON p.pronamespace = n.oid
    //     WHERE has_function_privilege($1, p.oid, 'EXECUTE')
    //       AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    //     ORDER BY n.nspname, p.proname;
    //   `, [rolename]);
      
    // permissions.functionPermissions = functionPerms.rows;

    // Get schema permissions
    const schemaPerms = await db.query(`
      SELECT 
        n.nspname AS schema_name,
        CASE
          WHEN has_schema_privilege($1, n.oid, 'CREATE') THEN 'CREATE'
          ELSE NULL
        END AS create_privilege,
        CASE
          WHEN has_schema_privilege($1, n.oid, 'USAGE') THEN 'USAGE'
          ELSE NULL
        END AS usage_privilege
      FROM pg_namespace n
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND (has_schema_privilege($1, n.oid, 'CREATE') OR has_schema_privilege($1, n.oid, 'USAGE'))
      ORDER BY n.nspname;
    `, [rolename]);
    
    permissions.schemaPermissions = schemaPerms.rows;

    // For database permissions, need to check if role has connect privilege
    const dbPerms = await db.query(`
      SELECT 
        datname AS database_name,
        CASE
          WHEN has_database_privilege($1, oid, 'CONNECT') THEN 'CONNECT'
          ELSE NULL
        END AS connect_privilege,
        CASE
          WHEN has_database_privilege($1, oid, 'CREATE') THEN 'CREATE'
          ELSE NULL
        END AS create_privilege,
        CASE
          WHEN has_database_privilege($1, oid, 'TEMP') THEN 'TEMP'
          ELSE NULL
        END AS temp_privilege
      FROM pg_database
      WHERE (has_database_privilege($1, oid, 'CONNECT') OR 
             has_database_privilege($1, oid, 'CREATE') OR
             has_database_privilege($1, oid, 'TEMP'))
      ORDER BY datname;
    `, [rolename]);
    
    permissions.databasePermissions = dbPerms.rows;

    return permissions;
  } catch (err) {
    console.error('Error listing detailed permissions:', err.message);
    throw err;
  }
};

module.exports = {
  grantReadPermissions,
  grantWritePermissions,
  grantReadPermissionsMulti,
  grantWritePermissionsMulti,
  revokeAllPermissions,
  revokeAllPermissionsMulti,
  listPermissions,
  listSchemas
}; 