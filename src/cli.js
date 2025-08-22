#!/usr/bin/env node
const { program } = require('commander');
const db = require('./services/db');
const { registerUserCommands } = require('./commands/userCommands');
const { registerRoleCommands } = require('./commands/roleCommands');
const { registerPermissionCommands } = require('./commands/permissionCommands');

// Initialize connection checking middleware
async function connectionCheck() {
  return await db.testConnection();
}

// Initialize the CLI with more detailed help
program
  .version('1.0.0')
  .description('PostgreSQL User Management CLI - A tool for managing users, roles and permissions in PostgreSQL databases')
  .on('--help', () => {
    console.log('\nExamples:');
    console.log('  $ pg-user-manager list-users');
    console.log('  $ pg-user-manager create-user');
    console.log('  $ pg-user-manager grant-read-permissions');
    console.log('\nFor more details on each command, run:');
    console.log('  $ pg-user-manager [command] --help');
  });

// Register all commands from the separate modules
registerUserCommands();
registerRoleCommands();
registerPermissionCommands();

// Add help command to show an overview of all available commands
program
  .command('help')
  .description('Display help for all commands')
  .action(() => {
    console.log('\nPostgreSQL User Manager - CLI tool for managing PostgreSQL users, roles, and permissions\n');
    console.log('Available Commands:\n');
    
    console.log('User Management:');
    console.log('  list-users              List all database users');
    console.log('  create-user             Create a new database user');
    console.log('  update-user-password    Update a user password');
    console.log('  delete-user             Delete a database user\n');
    
    console.log('Role Management:');
    console.log('  list-roles              List all database roles');
    console.log('  list-user-roles         List all roles assigned to a specific user');
    console.log('  create-role             Create a new database role');
    console.log('  delete-role             Delete a database role');
    console.log('  assign-user-to-role     Assign a user to a role');
    console.log('  remove-user-from-role   Remove a user from a role\n');
    
    console.log('Permission Management:');
    console.log('  grant-read-permissions  Grant read permissions to a role');
    console.log('  grant-write-permissions Grant write permissions to a role');
    console.log('  revoke-permissions      Revoke all permissions from a role');
    console.log('  list-permissions        List permissions for a role\n');
    
    console.log('For detailed help on a specific command, run:');
    console.log('  pg-user-manager [command] --help\n');
    
    console.log('Examples:');
    console.log('  pg-user-manager list-users');
    console.log('  pg-user-manager create-role');
    console.log('  pg-user-manager assign-user-to-role');
    console.log('  pg-user-manager grant-read-permissions');
  });

// Parse arguments and execute commands
program.parse(process.argv); 