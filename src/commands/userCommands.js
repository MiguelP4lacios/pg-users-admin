const { program } = require('commander');
const inquirer = require('inquirer');
const userService = require('../services/userService');
const db = require('../services/db');
const { displayUsersList } = require('../utils/displayUtils');
const { generateSecurePassword, saveUserToCSV } = require('../utils/passwordUtils');

function registerUserCommands() {
  // === User Commands ===
  program
    .command('list-users')
    .description('List all database users')
    .on('--help', () => {
      console.log('\nDisplays a table of all PostgreSQL users with their attributes:');
      console.log('  - username: The user login name');
      console.log('  - is_superuser: Whether the user has superuser privileges');
      console.log('  - can_create_role: Whether the user can create new roles');
      console.log('  - can_login: Whether the user can log in');
      console.log('\nExample:');
      console.log('  $ pg-user-manager list-users');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const users = await userService.listUsers();
          displayUsersList(users);
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('create-user')
    .description('Create a new database user')
    .on('--help', () => {
      console.log('\nInteractively creates a new PostgreSQL user with login privileges.');
      console.log('You will be prompted to enter:');
      console.log('  - Username: The login name for the user');
      console.log('  - Password type: Auto-generated or custom');
      console.log('  - Save credentials to CSV: Option to save to a CSV file');
      console.log('\nExample:');
      console.log('  $ pg-user-manager create-user');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          // Ask for username first
          const usernameAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'username',
              message: 'Enter username:',
              validate: input => input.length > 0 ? true : 'Username cannot be empty'
            }
          ]);
          
          // Ask about password generation method
          const passwordTypeAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'passwordType',
              message: 'How would you like to set the password?',
              choices: [
                { name: 'Auto-generate secure password', value: 'AUTO' },
                { name: 'Enter custom password', value: 'CUSTOM' }
              ]
            }
          ]);
          
          let password = '';
          
          if (passwordTypeAnswer.passwordType === 'AUTO') {
            // Ask for password generation options
            const passwordOptionsAnswer = await inquirer.prompt([
              {
                type: 'number',
                name: 'length',
                message: 'Password length:',
                default: 16,
                validate: input => input >= 8 ? true : 'Password must be at least 8 characters'
              },
              {
                type: 'confirm',
                name: 'includeSpecial',
                message: 'Include special characters?',
                default: true
              }
            ]);
            
            // Generate the password
            password = generateSecurePassword(
              passwordOptionsAnswer.length,
              passwordOptionsAnswer.includeSpecial,
              true, // always include numbers
              true  // always include uppercase
            );
            
            // Show the generated password
            console.log(`\nGenerated password: ${password}\n`);
          } else {
            // Ask for custom password
            const customPasswordAnswer = await inquirer.prompt([
              {
                type: 'password',
                name: 'password',
                message: 'Enter password:',
                validate: input => input.length > 0 ? true : 'Password cannot be empty'
              }
            ]);
            
            password = customPasswordAnswer.password;
          }
          
          // Create the user
          const userData = {
            username: usernameAnswer.username,
            password: password
          };
          
          const result = await userService.createUser(userData.username, userData.password);
          
          if (result.success) {
            console.log(result.message);
            
            // Ask if user wants to save credentials to CSV
            const saveAnswer = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'saveToCSV',
                message: 'Save credentials to CSV file?',
                default: true
              }
            ]);
            
            if (saveAnswer.saveToCSV) {
              const saveResult = saveUserToCSV(userData); // TODO: Use AWS Secrets Manager
              console.log(saveResult.message);
            }
          } else {
            console.log(result.message);
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('update-user-password')
    .description('Update a user password')
    .on('--help', () => {
      console.log('\nInteractively updates the password for an existing PostgreSQL user.');
      console.log('You will be prompted to:');
      console.log('  - Select a user from a list of existing users');
      console.log('  - Choose password type: Auto-generated or custom');
      console.log('  - Save credentials to CSV: Option to save to a CSV file');
      console.log('\nExample:');
      console.log('  $ pg-user-manager update-user-password');
    })
    .action(async () => {
      try {
        if (await db.testConnection()) {
          const users = await userService.listUsers();
          const usernames = users.map(user => user.username);
          
          // Ask for username first
          const usernameAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'username',
              message: 'Select user:',
              choices: usernames
            }
          ]);
          
          // Ask about password generation method
          const passwordTypeAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'passwordType',
              message: 'How would you like to set the password?',
              choices: [
                { name: 'Auto-generate secure password', value: 'AUTO' },
                { name: 'Enter custom password', value: 'CUSTOM' }
              ]
            }
          ]);
          
          let password = '';
          
          if (passwordTypeAnswer.passwordType === 'AUTO') {
            // Ask for password generation options
            const passwordOptionsAnswer = await inquirer.prompt([
              {
                type: 'number',
                name: 'length',
                message: 'Password length:',
                default: 16,
                validate: input => input >= 8 ? true : 'Password must be at least 8 characters'
              },
              {
                type: 'confirm',
                name: 'includeSpecial',
                message: 'Include special characters?',
                default: true
              }
            ]);
            
            // Generate the password
            password = generateSecurePassword(
              passwordOptionsAnswer.length,
              passwordOptionsAnswer.includeSpecial,
              true, // always include numbers
              true  // always include uppercase
            );
            
            // Show the generated password
            console.log(`\nGenerated password: ${password}\n`);
          } else {
            // Ask for custom password
            const customPasswordAnswer = await inquirer.prompt([
              {
                type: 'password',
                name: 'password',
                message: 'Enter new password:',
                validate: input => input.length > 0 ? true : 'Password cannot be empty'
              }
            ]);
            
            password = customPasswordAnswer.password;
          }
          
          // Update the user password
          const userData = {
            username: usernameAnswer.username,
            password: password
          };
          
          const result = await userService.updateUserPassword(userData.username, userData.password);
          
          if (result.success) {
            console.log(result.message);
            
            // Ask if user wants to save credentials to CSV
            const saveAnswer = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'saveToCSV',
                message: 'Save credentials to CSV file?',
                default: true
              }
            ]);
            
            if (saveAnswer.saveToCSV) {
              const saveResult = saveUserToCSV(userData);
              console.log(saveResult.message);
            }
          } else {
            console.log(result.message);
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });

  program
    .command('delete-user')
    .description('Delete a database user')
    .on('--help', () => {
      console.log('\nInteractively deletes an existing PostgreSQL user.');
      console.log('You will be prompted to:');
      console.log('  - Select a user from a list of existing users');
      console.log('  - Confirm the deletion');
      console.log('\nWarning: This action cannot be undone. Make sure the user is not the owner of any objects.');
      console.log('\nExample:');
      console.log('  $ pg-user-manager delete-user');
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
              message: 'Select user to delete:',
              choices: usernames
            },
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to delete this user?',
              default: false
            }
          ]);
          
          if (answers.confirm) {
            const result = await userService.deleteUser(answers.username);
            console.log(result.message);
          } else {
            console.log('Delete operation cancelled');
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    });
}

module.exports = { registerUserCommands }; 