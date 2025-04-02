require('dotenv').config();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

async function testLogin(email, password) {
  try {
    console.log(`Testing login for ${email}`);
    
    // Get user by email
    const user = await User.getUserByEmail(email);
    
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    console.log('✅ User found');
    console.log('User details:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Test password
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        console.log('✅ Password match successful');
        return true;
      } else {
        console.log('❌ Password does not match');
        return false;
      }
    } catch (error) {
      console.error('❌ Error comparing passwords:', error);
      return false;
    }
  } catch (error) {
    console.error('Test login error:', error);
    return false;
  }
}

// Use the test accounts from init-firebase.js
const testEmail = process.argv[2] || 'producer@example.com';
const testPassword = process.argv[3] || '123456';

testLogin(testEmail, testPassword)
  .then(result => {
    console.log(`Login test ${result ? 'succeeded' : 'failed'}`);
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  });
