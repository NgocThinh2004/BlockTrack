const firebase = require('../config/firebase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Initialize Firebase database with test users
 */
async function initializeFirebase() {
  console.log('Initializing Firebase database with test users...');
  
  try {
    const db = firebase.firestore();
    
    // Test the connection
    const testRef = db.collection('connectionTest').doc('test');
    await testRef.set({
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      message: 'Connection test from initializer'
    });
    console.log('Firebase connection successful!');
    
    // Check if we have any users already
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (!usersSnapshot.empty) {
      console.log('Users already exist in database. Skipping initialization.');
      return;
    }
    
    // Create test users
    const testUsers = [
      {
        name: 'Test Producer',
        email: 'producer@example.com',
        password: '123456',
        role: 'producer',
        address: '123 Producer St, Producer City',
        walletAddress: '0x1234567890123456789012345678901234567890'
      },
      {
        name: 'Test Distributor',
        email: 'distributor@example.com',
        password: '123456',
        role: 'distributor',
        address: '456 Distributor Ave, Distributor City',
        walletAddress: '0x2345678901234567890123456789012345678901'
      },
      {
        name: 'Test Retailer',
        email: 'retailer@example.com',
        password: '123456',
        role: 'retailer',
        address: '789 Retail Blvd, Retail City',
        walletAddress: '0x3456789012345678901234567890123456789012'
      }
    ];
    
    for (const userData of testUsers) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user object
      const user = {
        id: uuidv4(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role,
        address: userData.address,
        walletAddress: userData.walletAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      await db.collection('users').doc(user.id).set(user);
      console.log(`Created test user: ${userData.email} (${userData.role})`);
    }
    
    console.log('Firebase initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeFirebase()
    .then(() => {
      console.log('Initialization script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = initializeFirebase;
