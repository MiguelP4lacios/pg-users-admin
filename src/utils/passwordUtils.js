/**
 * Utility functions for password generation and management
 */
const fs = require('fs');
const path = require('path');

/**
 * Generate a secure random password
 * @param {number} length - Length of the password to generate
 * @param {boolean} includeSpecial - Whether to include special characters
 * @param {boolean} includeNumbers - Whether to include numbers
 * @param {boolean} includeUppercase - Whether to include uppercase letters
 * @returns {string} - The generated password
 */
function generateSecurePassword(
  length = 16,
  includeSpecial = true,
  includeNumbers = true,
  includeUppercase = true
) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let chars = lowercase;
  if (includeUppercase) chars += uppercase;
  if (includeNumbers) chars += numbers;
  if (includeSpecial) chars += special;
  
  let password = '';
  
  // Ensure the password includes at least one character from each selected set
  if (includeUppercase) password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  if (includeNumbers) password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  if (includeSpecial) password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest of the password
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars.charAt(randomIndex);
  }
  
  // Shuffle the password (Fisher-Yates algorithm)
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

/**
 * Save user credentials to a CSV file
 * @param {Object} userData - Object containing username and password
 * @returns {Object} - Result object with success status and message
 */
function saveUserToCSV(userData) {
  try {
    // Create directory if it doesn't exist
    const credentialsDir = path.join(process.cwd(), 'credentials');
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user_${userData.username}_${timestamp}.csv`;
    const filePath = path.join(credentialsDir, filename);
    
    // Create CSV content
    const csvContent = `Username,Password\n"${userData.username}","${userData.password}"`;
    
    // Write to file
    fs.writeFileSync(filePath, csvContent);
    
    return {
      success: true,
      filePath,
      message: `User credentials saved to ${filePath}`
    };
  } catch (err) {
    console.error('Error saving user credentials to CSV:', err);
    return {
      success: false,
      message: `Error saving user credentials: ${err.message}`
    };
  }
}

module.exports = {
  generateSecurePassword,
  saveUserToCSV
}; 