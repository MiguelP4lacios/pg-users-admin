/**
 * Utility functions for displaying formatted information in the terminal
 */
// Use CommonJS compatible version of chalk
const chalk = require('chalk');
const Table = require('cli-table3');
// No usaremos boxen, usaremos chalk directamente
// const boxen = (...args) => import('boxen').then(mod => mod.default(...args));
// Use dynamic import for ESM modules
const ora = (...args) => {
  // Simple spinner replacement
  return {
    start: () => ({ stop: () => {}, fail: () => {} })
  };
};
const columnify = require('columnify');

/**
 * Creates a formatted table with role information
 * @param {string} rolename - Name of the role
 * @param {Object} permissions - Permission object with all role permissions 
 * @returns {void} - Prints the formatted tables to console
 */
function displayRoleInformation(rolename, permissions) {
  // Show loading spinner while formatting the display
  const spinner = ora('Formatting role information...').start();
  
  try {
    // Create a header directly instead of using boxen
    console.log('\n');
    console.log(chalk.bgCyan.white.bold(` ROLE: ${rolename} `));
    console.log('\n');
    
    spinner.stop();
    
    // Mostrar resumen visual rápido (nuevo)
    displayQuickSummary(permissions);
    
    // Display basic role details
    displayRoleDetails(permissions.roleDetails);
    
    // Display description for system roles
    if (permissions.description) {
      console.log('\n' + chalk.yellow.bold('📝 Description:'));
      console.log('  ' + chalk.white(permissions.description));
    }
    
    // Display special notes for system roles
    displaySpecialNotes(permissions.specialNotes);
    
    // Display role membership
    displayRoleMembership(permissions.memberOf);
    
    // Display database permissions
    displayDatabasePermissions(permissions.databasePermissions);
    
    // Display schema permissions
    displaySchemaPermissions(permissions.schemaPermissions);
    
    // Display table permissions
    displayTablePermissions(permissions.tablePermissions);
    
    // Display column permissions
    displayColumnPermissions(permissions.columnPermissions);
    
    // Display function permissions
    displayFunctionPermissions(permissions.functionPermissions);
    
    // Display summary box
    console.log('\n');
    console.log(chalk.bgGreen.black.bold(`✅ Permissions displayed for role: ${rolename}`));
    console.log('\n');
  } catch (error) {
    console.error(`Error displaying role information: ${error.message}`);
  }
}

/**
 * Displays a list of roles in a formatted table
 * @param {Array} roles - Array of role objects
 */
function displayRolesList(roles) {
  console.log('\n' + chalk.yellow.bold('👥 Role List:'));

  if (!roles || roles.length === 0) {
    console.log('  ' + chalk.italic.gray('No roles found'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Name'),
      chalk.cyan.bold('Superuser'),
      chalk.cyan.bold('Create Roles'),
      chalk.cyan.bold('Create DB'),
      chalk.cyan.bold('Can Login')
    ],
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  roles.forEach(role => {
    table.push([
      chalk.green.bold(role.rolename),
      formatBooleanValue(role.is_superuser),
      formatBooleanValue(role.can_create_role),
      formatBooleanValue(role.can_create_db),
      formatBooleanValue(role.can_login)
    ]);
  });

  console.log(table.toString());
  console.log(`\n${chalk.gray('Total roles:')} ${chalk.white.bold(roles.length)}`);
}

/**
 * Displays a list of users in a formatted table
 * @param {Array} users - Array of user objects
 */
function displayUsersList(users) {
  console.log('\n' + chalk.yellow.bold('👤 User List:'));

  if (!users || users.length === 0) {
    console.log('  ' + chalk.italic.gray('No users found'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Username'),
      chalk.cyan.bold('Superuser'),
      chalk.cyan.bold('Create Roles'),
      chalk.cyan.bold('Create DB'),
      chalk.cyan.bold('Can Login')
    ],
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  users.forEach(user => {
    table.push([
      chalk.blue.bold(user.username),
      formatBooleanValue(user.is_superuser),
      formatBooleanValue(user.can_create_role),
      formatBooleanValue(user.can_create_db),
      formatBooleanValue(user.can_login)
    ]);
  });

  console.log(table.toString());
  console.log(`\n${chalk.gray('Total users:')} ${chalk.white.bold(users.length)}`);
}

/**
 * Displays a list of roles assigned to a user in a formatted table
 * @param {string} username - The username
 * @param {Array} roles - Array of role objects assigned to the user
 */
function displayUserRoles(username, roles) {
  console.log('\n' + chalk.yellow.bold(`👤 Roles assigned to ${chalk.blue.bold(username)}:`));

  if (!roles || roles.length === 0) {
    console.log('  ' + chalk.italic.gray(`User ${username} has no assigned roles.`));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Role Name'),
      chalk.cyan.bold('Superuser'),
      chalk.cyan.bold('Create Roles'),
      chalk.cyan.bold('Create DB')
    ],
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  roles.forEach(role => {
    table.push([
      chalk.green.bold(role.rolename),
      formatBooleanValue(role.is_superuser),
      formatBooleanValue(role.can_create_role),
      formatBooleanValue(role.can_create_db)
    ]);
  });

  console.log(table.toString());
  console.log(`\n${chalk.gray('Total assigned roles:')} ${chalk.white.bold(roles.length)}`);
}

/**
 * Displays a quick visual summary of permissions (new function)
 * @param {Object} permissions - Permission object with all role permissions
 */
function displayQuickSummary(permissions) {
  if (!permissions) return;
  
  console.log('\n' + chalk.magenta.bold('🔑 Permissions Summary:'));
  
  const hasReadPermissions = permissions.tablePermissions && 
    permissions.tablePermissions.some(p => p.privilege_type === 'SELECT');
  
  const hasWritePermissions = permissions.tablePermissions && 
    permissions.tablePermissions.some(p => ['INSERT', 'UPDATE', 'DELETE'].includes(p.privilege_type));
  
  const hasAdminPermissions = permissions.roleDetails && 
    (permissions.roleDetails.rolsuper || permissions.roleDetails.rolcreatedb || permissions.roleDetails.rolcreaterole);
  
  const summaryItems = [
    { type: 'Read', value: hasReadPermissions ? '✓' : '✗', color: hasReadPermissions ? 'green' : 'red' },
    { type: 'Write', value: hasWritePermissions ? '✓' : '✗', color: hasWritePermissions ? 'green' : 'red' },
    { type: 'Admin', value: hasAdminPermissions ? '✓' : '✗', color: hasAdminPermissions ? 'green' : 'red' },
  ];
  
  const table = new Table({
    style: { head: [], border: [] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    }
  });
  
  table.push(
    summaryItems.map(item => chalk[item.color].bold(`${item.type}: ${item.value}`))
  );
  
  console.log(table.toString());
  
  // Add stats about permissions
  const totalTables = permissions.tablePermissions ? 
    new Set(permissions.tablePermissions.map(p => `${p.table_schema}.${p.table_name}`)).size : 0;
  
  const totalColumns = permissions.columnPermissions ?
    new Set(permissions.columnPermissions.map(p => `${p.table_schema}.${p.table_name}.${p.column_name}`)).size : 0;
  
  console.log(chalk.gray('⚡ Statistics:'));
  console.log(chalk.gray(`  • ${totalTables} tables with permissions`));
  console.log(chalk.gray(`  • ${totalColumns} columns with specific permissions`));
}

/**
 * Displays role details in a formatted table
 * @param {Object} roleDetails - Role details object
 */
function displayRoleDetails(roleDetails) {
  if (!roleDetails) return;
  
  // Create section header
  console.log('\n' + chalk.yellow.bold('👤 Role Details:'));
  
  const table = new Table({
    head: [
      chalk.cyan.bold('Attribute'), 
      chalk.cyan.bold('Value')
    ],
    colWidths: [25, 50],
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  table.push(
    [chalk.white('Name'), chalk.green.bold(roleDetails.rolname || 'N/A')],
    [chalk.white('Superuser'), formatBooleanValue(roleDetails.rolsuper)],
    [chalk.white('Create Roles'), formatBooleanValue(roleDetails.rolcreaterole)],
    [chalk.white('Create Database'), formatBooleanValue(roleDetails.rolcreatedb)],
    [chalk.white('Can Login'), formatBooleanValue(roleDetails.rolcanlogin)],
    [chalk.white('Inherit'), formatBooleanValue(roleDetails.rolinherit)]
  );
  
  if (roleDetails.rolreplication) {
    table.push(['Replication', formatBooleanValue(roleDetails.rolreplication)]);
  }
  
  if (roleDetails.rolconnlimit !== -1) {
    table.push(['Connection Limit', chalk.blue(roleDetails.rolconnlimit.toString())]);
  }
  
  if (roleDetails.rolvaliduntil) {
    table.push(['Valid Until', chalk.blue(roleDetails.rolvaliduntil)]);
  }
  
  console.log(table.toString());
}

/**
 * Displays special notes in a formatted list
 * @param {Array} specialNotes - Array of special notes
 */
function displaySpecialNotes(specialNotes) {
  if (!specialNotes || specialNotes.length === 0) return;
  
  console.log('\n' + chalk.yellow.bold('⚠️ Special Notes:'));
  specialNotes.forEach(note => {
    console.log('  ' + chalk.red('•') + ' ' + chalk.white(note));
  });
}

/**
 * Displays role membership in a formatted table
 * @param {Array} memberOf - Array of roles this role is a member of
 */
function displayRoleMembership(memberOf) {
  console.log('\n' + chalk.yellow.bold('👥 Member of Roles:'));
  
  if (!memberOf || memberOf.length === 0) {
    console.log('  ' + chalk.italic.gray('None'));
    return;
  }
  
  const table = new Table({
    head: [chalk.cyan.bold('Parent Role')],
    colWidths: [50],
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  memberOf.forEach(membership => {
    table.push([chalk.green(membership.parent_role)]);
  });
  
  console.log(table.toString());
}

/**
 * Displays database permissions in a formatted table
 * @param {Array} databasePermissions - Array of database permissions
 */
function displayDatabasePermissions(databasePermissions) {
  console.log('\n' + chalk.yellow.bold('🗄️ Database Permissions:'));
  
  if (!databasePermissions || databasePermissions.length === 0) {
    console.log('  ' + chalk.italic.gray('None'));
    return;
  }
  
  const table = new Table({
    head: [chalk.cyan.bold('Database'), chalk.cyan.bold('Privileges')],
    colWidths: [30, 45],
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  databasePermissions.forEach(perm => {
    const privileges = [];
    if (perm.connect_privilege) privileges.push(formatPrivilege(perm.connect_privilege));
    if (perm.create_privilege) privileges.push(formatPrivilege(perm.create_privilege));
    if (perm.temp_privilege) privileges.push(formatPrivilege(perm.temp_privilege));
    
    table.push([
      chalk.white(perm.database_name),
      privileges.join(', ') || chalk.italic.gray('None')
    ]);
  });
  
  console.log(table.toString());
}

/**
 * Displays schema permissions in a formatted table
 * @param {Array} schemaPermissions - Array of schema permissions
 */
function displaySchemaPermissions(schemaPermissions) {
  console.log('\n' + chalk.yellow.bold('📋 Schema Permissions:'));
  
  if (!schemaPermissions || schemaPermissions.length === 0) {
    console.log('  ' + chalk.italic.gray('None'));
    return;
  }
  
  const table = new Table({
    head: [chalk.cyan.bold('Schema'), chalk.cyan.bold('Privileges')],
    colWidths: [30, 45],
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  schemaPermissions.forEach(perm => {
    const privileges = [];
    if (perm.usage_privilege) privileges.push(formatPrivilege(perm.usage_privilege));
    if (perm.create_privilege) privileges.push(formatPrivilege(perm.create_privilege));
    
    table.push([
      chalk.white(perm.schema_name),
      privileges.join(', ') || chalk.italic.gray('None')
    ]);
  });
  
  console.log(table.toString());
}

/**
 * Displays table permissions in a formatted table
 * @param {Array} tablePermissions - Array of table permissions
 */
function displayTablePermissions(tablePermissions) {
  console.log('\n' + chalk.yellow.bold('📊 Table Permissions:'));
  
  if (!tablePermissions || tablePermissions.length === 0) {
    console.log('  ' + chalk.italic.gray('None'));
    return;
  }
  
  // Group permissions by table
  const tablePermsByTable = {};
  tablePermissions.forEach(perm => {
    const tableKey = `${perm.table_schema}.${perm.table_name}`;
    if (!tablePermsByTable[tableKey]) {
      tablePermsByTable[tableKey] = [];
    }
    tablePermsByTable[tableKey].push(perm.privilege_type);
  });
  
  const table = new Table({
    head: [chalk.cyan.bold('Table'), chalk.cyan.bold('Privileges')],
    colWidths: [40, 35],
    wordWrap: true,
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  // Display permissions for each table with visual indicators
  Object.keys(tablePermsByTable).sort().forEach(tableKey => {
    const perms = tablePermsByTable[tableKey];
    const permIcons = [];
    
    if (perms.includes('SELECT')) permIcons.push(chalk.green('🔍'));
    if (perms.includes('INSERT')) permIcons.push(chalk.blue('➕'));
    if (perms.includes('UPDATE')) permIcons.push(chalk.yellow('✏️'));
    if (perms.includes('DELETE')) permIcons.push(chalk.red('🗑️'));
    
    table.push([
      chalk.white(tableKey),
      permIcons.join(' ') + ' ' + perms.map(formatPrivilege).join(', ')
    ]);
  });
  
  console.log(table.toString());
}

/**
 * Displays column permissions in a formatted table
 * @param {Array} columnPermissions - Array of column permissions
 */
function displayColumnPermissions(columnPermissions) {
  console.log('\n' + chalk.yellow.bold('📝 Column Permissions:'));
  
  if (!columnPermissions || columnPermissions.length === 0) {
    console.log('  ' + chalk.italic.gray('None'));
    return;
  }
  
  // Group permissions by table first, then by column
  const permsByTable = {};
  columnPermissions.forEach(perm => {
    const tableKey = `${perm.table_schema}.${perm.table_name}`;
    
    if (!permsByTable[tableKey]) {
      permsByTable[tableKey] = {};
    }
    
    const columnName = perm.column_name;
    if (!permsByTable[tableKey][columnName]) {
      permsByTable[tableKey][columnName] = [];
    }
    
    permsByTable[tableKey][columnName].push(perm.privilege_type);
  });
  
  // For each table, create a subtable of column permissions
  Object.keys(permsByTable).sort().forEach(tableKey => {
    console.log(chalk.cyan(`\n  Table: ${chalk.white.bold(tableKey)}`));
    
    const columnTable = new Table({
      head: [chalk.cyan('Column'), chalk.cyan('Privileges')],
      colWidths: [25, 45],
      style: { head: [], border: [] },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      }
    });
    
    Object.keys(permsByTable[tableKey]).sort().forEach(columnName => {
      columnTable.push([
        chalk.white(columnName),
        permsByTable[tableKey][columnName].map(formatPrivilege).join(', ')
      ]);
    });
    
    console.log(columnTable.toString());
  });
}

/**
 * Displays function permissions in a formatted table
 * @param {Array} functionPermissions - Array of function permissions
 */
function displayFunctionPermissions(functionPermissions) {
  console.log('\n' + chalk.yellow.bold('⚙️ Function Permissions:'));
  
  if (!functionPermissions || functionPermissions.length === 0) {
    console.log('  ' + chalk.italic.gray('None'));
    return;
  }
  
  const table = new Table({
    head: [chalk.cyan.bold('Function'), chalk.cyan.bold('Privilege')],
    colWidths: [45, 30],
    wordWrap: true,
    style: { head: [], border: [] },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  functionPermissions.forEach(perm => {
    table.push([
      chalk.white(`${perm.schema_name}.${perm.function_name}(${perm.argument_types})`),
      formatPrivilege(perm.privilege)
    ]);
  });
  
  console.log(table.toString());
}

/**
 * Format boolean values with colors
 * @param {boolean} value - Boolean value to format
 * @returns {string} - Formatted string
 */
function formatBooleanValue(value) {
  return value ? chalk.green.bold('✓ Yes') : chalk.red.bold('✗ No');
}

/**
 * Format privilege with colors based on type
 * @param {string} privilege - Privilege name
 * @returns {string} - Formatted string with color
 */
function formatPrivilege(privilege) {
  const privilegeMap = {
    'SELECT': chalk.green.bold('SELECT'),
    'INSERT': chalk.blue.bold('INSERT'),
    'UPDATE': chalk.yellow.bold('UPDATE'),
    'DELETE': chalk.red.bold('DELETE'),
    'TRUNCATE': chalk.red.bold('TRUNCATE'),
    'REFERENCES': chalk.magenta.bold('REFERENCES'),
    'TRIGGER': chalk.cyan.bold('TRIGGER'),
    'USAGE': chalk.blue.bold('USAGE'),
    'CONNECT': chalk.green.bold('CONNECT'),
    'CREATE': chalk.yellow.bold('CREATE'),
    'TEMPORARY': chalk.cyan.bold('TEMPORARY'),
    'EXECUTE': chalk.magenta.bold('EXECUTE'),
    'ALL': chalk.black.bgRed.bold('ALL')
  };
  
  return privilegeMap[privilege] || privilege;
}

module.exports = {
  displayRoleInformation,
  displayRolesList,
  displayUsersList,
  displayUserRoles
}; 