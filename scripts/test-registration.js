const User = require('../models/userModel');

async function testRegistration() {
  try {
    console.log('Testing email existence check...');
    
    // Use a test email
    const testEmail = 'test@example.com';
    const emailExists = await User.emailExists(testEmail);
    console.log(`Email ${testEmail} exists: ${emailExists}`);

    // Use a test wallet
    const testWallet = '0x0000000000000000000000000000000000000000';
    const walletExists = await User.walletExists(testWallet);
    console.log(`Wallet ${testWallet} exists: ${walletExists}`);
    
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistration();
