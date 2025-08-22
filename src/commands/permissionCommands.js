const { program } = require('commander');
const inquirer = require('inquirer');
const roleService = require('../services/roleService');
const permissionService = require('../services/permissionService');
const db = require('../services/db');
const { displayRoleInformation } = require('../utils/displayUtils');

function registerPermissionCommands() {
  // === Permission Commands ===
  program
    .command('grant-read-permissions')
    .description('Grant read permissions to a role')
    .on('--help', () => {
      console.log('\nInteractively grants READ permissions to a role for all tables in one or more schemas.');
      console.log('The following permissions will be granted:');
      console.log('  - CONNECT on the database');
      console.log('  - USAGE on the schema(s)');
      console.log('  - SELECT on all tables in the schema(s)');
      console.log('  - SELECT on all future tables (ALTER DEFAULT PRIVILEGES)');
      console.log('\nYou will be prompted to:');
      console.log('  - Select a role from a list of existing roles');
      console.log('  - Enter the database name (defaults to the one in .env)');
      console.log('  - Choose schema options: specific schema, multiple schemas, or all schemas');
      console.log('\nExample:');
      console.log('  $ pg-user-manager grant-read-permissions');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const roles = await roleService.listRoles();
          const rolenames = roles.map(role => role.rolename);
          
          // Get the database name first
          const dbAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'rolename',
              message: 'Select role:',
              choices: rolenames
            },
            {
              type: 'input',
              name: 'database',
              message: 'Database name:',
              default: process.env.DB_NAME
            }
          ]);
          
          // Now get the list of schemas
          const schemas = await permissionService.listSchemas();
          
          // Add "All schemas" option to the beginning of the list
          const schemaChoices = [
            { name: 'All schemas', value: 'ALL' },
            new inquirer.Separator('---------- Individual schemas ----------')
          ].concat(schemas);
          
          // Ask for schema selection strategy
          const schemaAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'schemaSelection',
              message: 'How would you like to select schemas?',
              choices: [
                { name: 'Single schema', value: 'SINGLE' },
                { name: 'Multiple schemas', value: 'MULTIPLE' },
                { name: 'All schemas', value: 'ALL' }
              ]
            }
          ]);
          
          let selectedSchemas = [];
          
          if (schemaAnswer.schemaSelection === 'SINGLE') {
            // Single schema selection
            const singleAnswer = await inquirer.prompt([
              {
                type: 'list',
                name: 'schema',
                message: 'Select schema:',
                choices: schemas,
                default: 'public'
              }
            ]);
            selectedSchemas = [singleAnswer.schema];
          } 
          else if (schemaAnswer.schemaSelection === 'MULTIPLE') {
            // Multiple schema selection
            const multiAnswer = await inquirer.prompt([
              {
                type: 'checkbox',
                name: 'schemas',
                message: 'Select schemas:',
                choices: schemas,
                validate: (answer) => {
                  if (answer.length < 1) {
                    return 'You must choose at least one schema.';
                  }
                  return true;
                }
              }
            ]);
            selectedSchemas = multiAnswer.schemas;
          }
          else if (schemaAnswer.schemaSelection === 'ALL') {
            // All schemas
            selectedSchemas = schemas;
          }
          
          // Ensure we have schemas to work with
          if (selectedSchemas.length === 0) {
            console.log('Error: No schemas selected.');
            return;
          }
          
          // If only one schema is selected, use the regular function
          let result;
          if (selectedSchemas.length === 1) {
            result = await permissionService.grantReadPermissions(
              dbAnswer.rolename,
              dbAnswer.database,
              selectedSchemas[0]
            );
          } else {
            // For multiple schemas, use the multi version
            result = await permissionService.grantReadPermissionsMulti(
              dbAnswer.rolename,
              dbAnswer.database,
              selectedSchemas
            );
          }
          
          console.log(result.message);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('grant-write-permissions')
    .description('Grant write permissions to a role')
    .on('--help', () => {
      console.log('\nInteractively grants WRITE (and READ) permissions to a role for all tables in one or more schemas.');
      console.log('The following permissions will be granted:');
      console.log('  - All READ permissions (CONNECT, USAGE, SELECT)');
      console.log('  - INSERT, UPDATE, DELETE on all tables in the schema(s)');
      console.log('  - INSERT, UPDATE, DELETE on all future tables (ALTER DEFAULT PRIVILEGES)');
      console.log('  - USAGE on all sequences in the schema(s)');
      console.log('  - USAGE on all future sequences (ALTER DEFAULT PRIVILEGES)');
      console.log('\nYou will be prompted to:');
      console.log('  - Select a role from a list of existing roles');
      console.log('  - Enter the database name (defaults to the one in .env)');
      console.log('  - Choose schema options: specific schema, multiple schemas, or all schemas');
      console.log('\nExample:');
      console.log('  $ pg-user-manager grant-write-permissions');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const roles = await roleService.listRoles();
          const rolenames = roles.map(role => role.rolename);
          
          // Get the database name first
          const dbAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'rolename',
              message: 'Select role:',
              choices: rolenames
            },
            {
              type: 'input',
              name: 'database',
              message: 'Database name:',
              default: process.env.DB_NAME
            }
          ]);
          
          // Now get the list of schemas
          const schemas = await permissionService.listSchemas();
          
          // Ask for schema selection strategy
          const schemaAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'schemaSelection',
              message: 'How would you like to select schemas?',
              choices: [
                { name: 'Single schema', value: 'SINGLE' },
                { name: 'Multiple schemas', value: 'MULTIPLE' },
                { name: 'All schemas', value: 'ALL' }
              ]
            }
          ]);
          
          let selectedSchemas = [];
          
          if (schemaAnswer.schemaSelection === 'SINGLE') {
            // Single schema selection
            const singleAnswer = await inquirer.prompt([
              {
                type: 'list',
                name: 'schema',
                message: 'Select schema:',
                choices: schemas,
                default: 'public'
              }
            ]);
            selectedSchemas = [singleAnswer.schema];
          } 
          else if (schemaAnswer.schemaSelection === 'MULTIPLE') {
            // Multiple schema selection
            const multiAnswer = await inquirer.prompt([
              {
                type: 'checkbox',
                name: 'schemas',
                message: 'Select schemas:',
                choices: schemas,
                validate: (answer) => {
                  if (answer.length < 1) {
                    return 'You must choose at least one schema.';
                  }
                  return true;
                }
              }
            ]);
            selectedSchemas = multiAnswer.schemas;
          }
          else if (schemaAnswer.schemaSelection === 'ALL') {
            // All schemas
            selectedSchemas = schemas;
          }
          
          // Ensure we have schemas to work with
          if (selectedSchemas.length === 0) {
            console.log('Error: No schemas selected.');
            return;
          }
          
          // If only one schema is selected, use the regular function
          let result;
          if (selectedSchemas.length === 1) {
            result = await permissionService.grantWritePermissions(
              dbAnswer.rolename,
              dbAnswer.database,
              selectedSchemas[0]
            );
          } else {
            // For multiple schemas, use the multi version
            result = await permissionService.grantWritePermissionsMulti(
              dbAnswer.rolename,
              dbAnswer.database,
              selectedSchemas
            );
          }
          
          console.log(result.message);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('revoke-permissions')
    .description('Revoke all permissions from a role')
    .on('--help', () => {
      console.log('\nInteractively revokes ALL permissions from a role for all tables in one or more schemas.');
      console.log('This includes:');
      console.log('  - ALL PRIVILEGES on all tables in the schema(s)');
      console.log('  - ALL PRIVILEGES on all sequences in the schema(s)');
      console.log('  - ALL PRIVILEGES on the schema(s)');
      console.log('  - ALL PRIVILEGES on the database');
      console.log('  - ALL PRIVILEGES on all future tables and sequences (ALTER DEFAULT PRIVILEGES)');
      console.log('\nYou will be prompted to:');
      console.log('  - Select a role from a list of existing roles');
      console.log('  - Enter the database name (defaults to the one in .env)');
      console.log('  - Choose schema options: specific schema, multiple schemas, or all schemas');
      console.log('  - Confirm the revocation of all permissions');
      console.log('\nExample:');
      console.log('  $ pg-user-manager revoke-permissions');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const roles = await roleService.listRoles();
          const rolenames = roles.map(role => role.rolename);
          
          // Get the database name first
          const dbAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'rolename',
              message: 'Select role:',
              choices: rolenames
            },
            {
              type: 'input',
              name: 'database',
              message: 'Database name:',
              default: process.env.DB_NAME
            }
          ]);
          
          // Now get the list of schemas
          const schemas = await permissionService.listSchemas();
          
          // Ask for schema selection strategy
          const schemaAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'schemaSelection',
              message: 'How would you like to select schemas?',
              choices: [
                { name: 'Single schema', value: 'SINGLE' },
                { name: 'Multiple schemas', value: 'MULTIPLE' },
                { name: 'All schemas', value: 'ALL' }
              ]
            }
          ]);
          
          let selectedSchemas = [];
          
          if (schemaAnswer.schemaSelection === 'SINGLE') {
            // Single schema selection
            const singleAnswer = await inquirer.prompt([
              {
                type: 'list',
                name: 'schema',
                message: 'Select schema:',
                choices: schemas,
                default: 'public'
              }
            ]);
            selectedSchemas = [singleAnswer.schema];
          } 
          else if (schemaAnswer.schemaSelection === 'MULTIPLE') {
            // Multiple schema selection
            const multiAnswer = await inquirer.prompt([
              {
                type: 'checkbox',
                name: 'schemas',
                message: 'Select schemas:',
                choices: schemas,
                validate: (answer) => {
                  if (answer.length < 1) {
                    return 'You must choose at least one schema.';
                  }
                  return true;
                }
              }
            ]);
            selectedSchemas = multiAnswer.schemas;
          }
          else if (schemaAnswer.schemaSelection === 'ALL') {
            // All schemas
            selectedSchemas = schemas;
          }
          
          // Ensure we have schemas to work with
          if (selectedSchemas.length === 0) {
            console.log('Error: No schemas selected.');
            return;
          }
          
          // Confirmation
          const confirmAnswer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to revoke all permissions from ${selectedSchemas.length} schema(s)?`,
              default: false
            }
          ]);
          
          if (confirmAnswer.confirm) {
            // If only one schema is selected, use the regular function
            let result;
            if (selectedSchemas.length === 1) {
              result = await permissionService.revokeAllPermissions(
                dbAnswer.rolename, 
                dbAnswer.database, 
                selectedSchemas[0]
              );
            } else {
              // For multiple schemas, use the multi version
              result = await permissionService.revokeAllPermissionsMulti(
                dbAnswer.rolename,
                dbAnswer.database,
                selectedSchemas
              );
            }
            console.log(result.message);
          } else {
            console.log('Revoke operation cancelled');
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('list-permissions')
    .description('List permissions for a role')
    .on('--help', () => {
      console.log('\nDisplays detailed information about permissions granted to a role:');
      console.log('  - Basic role attributes');
      console.log('  - Table permissions (SELECT, INSERT, UPDATE, DELETE, etc.)');
      console.log('  - Column-level permissions');
      console.log('  - Schema permissions (USAGE, CREATE)');
      console.log('  - Database permissions (CONNECT, CREATE, TEMP)');
      console.log('  - Function permissions (for system roles)');
      console.log('  - Role memberships');
      console.log('  - Special notes for system roles');
      console.log('\nYou will be prompted to:');
      console.log('  - Select a role from a list of existing roles');
      console.log('\nExample:');
      console.log('  $ pg-user-manager list-permissions');
    })
    .option('-s, --system-roles', 'List system roles only')
    .action(async (options) => {
      try {
        if (await db.testConnection()) {
          let all = false;
          if (options.systemRoles) {
            all = true;
          }
          const roles = await roleService.listRoles(all);
          const rolenames = roles.map(role => role.rolename);

          if (rolenames.length === 0) {
            console.log('No roles found regular roles');
            return;
          }

          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'rolename',
              message: 'Select role:',
              choices: rolenames
            }
          ]);

          const permissions = await permissionService.listPermissions(answers.rolename);

          // Use the new display utility instead of console.log
          displayRoleInformation(answers.rolename, permissions);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });
}

module.exports = { registerPermissionCommands }; 