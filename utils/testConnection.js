const firebase = require('../config/firebase');

/**
 * Test Firebase connection
 */
async function testConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to write to a test collection
    const testRef = firebase.firestore().collection('connection_tests').doc('test');
    await testRef.set({
      timestamp: new Date().toISOString(),
      message: 'Connection test successful'
    });
    
    console.log('✅ Firebase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
}

module.exports = testConnection;
