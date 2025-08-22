const { program } = require('commander');
const inquirer = require('inquirer');
const roleService = require('../services/roleService');
const userService = require('../services/userService');
const db = require('../services/db');
const { displayRolesList, displayUserRoles } = require('../utils/displayUtils');

function registerRoleCommands() {
  // === Role Commands ===
  program
    .command('list-roles')
    .description('List all database roles')
    .on('--help', () => {
      console.log('\nDisplays a table of all PostgreSQL roles (groups without login privileges):');
      console.log('  - rolename: The role name');
      console.log('  - is_superuser: Whether the role has superuser privileges');
      console.log('  - can_create_role: Whether the role can create new roles');
      console.log('  - can_login: Whether the role can log in (always false for roles in this list)');
      console.log('\nExample:');
      console.log('  $ pg-user-manager list-roles');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const roles = await roleService.listRoles();
          displayRolesList(roles);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('list-user-roles')
    .description('List all roles assigned to a specific user')
    .on('--help', () => {
      console.log('\nDisplays a table of all PostgreSQL roles assigned to a specific user:');
      console.log('  - rolename: The role name');
      console.log('  - is_superuser: Whether the role has superuser privileges');
      console.log('  - can_create_role: Whether the role can create new roles');
      console.log('\nYou will be prompted to:');
      console.log('  - Select a user from a list of existing users');
      console.log('\nExample:');
      console.log('  $ pg-user-manager list-user-roles');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const users = await userService.listUsers();
          const usernames = users.map(user => user.username);
          
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'username',
              message: 'Select user:',
              choices: usernames
            }
          ]);
          
          const roles = await roleService.listUserRoles(answers.username);
          displayUserRoles(answers.username, roles);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('create-role')
    .description('Create a new database role')
    .on('--help', () => {
      console.log('\nInteractively creates a new PostgreSQL role without login privileges.');
      console.log('You will be prompted to enter:');
      console.log('  - Role name: The name for the new role');
      console.log('\nRoles are used to group privileges that can be granted to users.');
      console.log('\nExample:');
      console.log('  $ pg-user-manager create-role');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'rolename',
              message: 'Enter role name:',
              validate: input => input.length > 0 ? true : 'Role name cannot be empty'
            }
          ]);
          
          const result = await roleService.createRole(answers.rolename);
          console.log(result.message);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('delete-role')
    .description('Delete a database role')
    .on('--help', () => {
      console.log('\nInteractively deletes an existing PostgreSQL role.');
      console.log('You will be prompted to:');
      console.log('  - Select a role from a list of existing roles');
      console.log('  - Confirm the deletion');
      console.log('\nWarning: This action cannot be undone. Make sure the role is not assigned to any users');
      console.log('         and does not own any database objects.');
      console.log('\nExample:');
      console.log('  $ pg-user-manager delete-role');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const roles = await roleService.listRoles();
          const rolenames = roles.map(role => role.rolename);
          
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'rolename',
              message: 'Select role to delete:',
              choices: rolenames
            },
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to delete this role?',
              default: false
            }
          ]);
          
          if (answers.confirm) {
            const result = await roleService.deleteRole(answers.rolename);
            console.log(result.message);
          } else {
            console.log('Delete operation cancelled');
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('assign-user-to-role')
    .description('Assign a user to a role')
    .on('--help', () => {
      console.log('\nInteractively assigns an existing user to an existing role.');
      console.log('You will be prompted to:');
      console.log('  - Select a user from a list of existing users');
      console.log('  - Select a role from a list of existing roles');
      console.log('\nThis grants the user all privileges associated with the role.');
      console.log('\nExample:');
      console.log('  $ pg-user-manager assign-user-to-role');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const users = await userService.listUsers();
          const usernames = users.map(user => user.username);
          
          const roles = await roleService.listRoles();
          const rolenames = roles.map(role => role.rolename);
          
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'username',
              message: 'Select user:',
              choices: usernames
            },
            {
              type: 'list',
              name: 'rolename',
              message: 'Select role:',
              choices: rolenames
            }
          ]);
          
          const result = await roleService.assignUserToRole(answers.username, answers.rolename);
          console.log(result.message);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('remove-user-from-role')
    .description('Remove a user from a role')
    .on('--help', () => {
      console.log('\nInteractively removes a user from a role.');
      console.log('You will be prompted to:');
      console.log('  - Select a user from a list of existing users');
      console.log('  - Select a role from a list of existing roles');
      console.log('\nThis revokes the privileges associated with the role from the user.');
      console.log('\nExample:');
      console.log('  $ pg-user-manager remove-user-from-role');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const users = await userService.listUsers();
          const usernames = users.map(user => user.username);
          
          const roles = await roleService.listRoles();
          const rolenames = roles.map(role => role.rolename);
          
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'username',
              message: 'Select user:',
              choices: usernames
            },
            {
              type: 'list',
              name: 'rolename',
              message: 'Select role:',
              choices: rolenames
            }
          ]);
          
          const result = await roleService.removeUserFromRole(answers.username, answers.rolename);
          console.log(result.message);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });
}

module.exports = { registerRoleCommands }; 