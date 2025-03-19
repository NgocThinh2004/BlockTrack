const firebase = require('firebase/app');
require('firebase/firestore');
require('firebase/auth');
require('firebase/storage');
const dotenv = require('dotenv');

dotenv.config();

// Firebase configuration - load from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Kiểm tra xem có đầy đủ thông tin kết nối Firebase không
const hasFirebaseConfig = Object.values(firebaseConfig).every(value => !!value);

// Provide a mock Firebase in case of initialization failure
const createMockFirebase = () => {
  console.log('Using mock Firebase implementation');
  
  return {
    firestore: () => ({
      collection: () => ({
        get: async () => ({ docs: [], empty: true }),
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}) }),
          set: async () => ({}),
          update: async () => ({})
        }),
        where: () => ({ 
          limit: () => ({
            get: async () => ({ docs: [], empty: true })
          })
        })
      }),
      settings: () => ({}),
      FieldValue: {
        serverTimestamp: () => new Date().toISOString(),
        increment: (num) => num
      }
    }),
    auth: () => ({
      createUserWithEmailAndPassword: async () => ({ user: { uid: 'mock-uid' } }),
      signInWithEmailAndPassword: async () => ({ user: { uid: 'mock-uid' } })
    }),
    storage: () => ({ ref: () => ({ put: async () => ({}) }) })
  };
};

// Initialize Firebase or use mock
try {
  if (!hasFirebaseConfig) {
    console.warn('Firebase configuration missing or incomplete. Using mock Firebase.');
    module.exports = createMockFirebase();
  } else {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
    } else {
      console.log('Firebase already initialized with project:', firebase.apps[0].options.projectId);
    }
    
    firebase.firestore().settings({
      ignoreUndefinedProperties: true,
    });
    
    // Test the connection
    firebase.firestore().collection('connectionTest').doc('test')
      .set({ timestamp: new Date().toISOString(), status: 'ok' })
      .then(() => console.log('✅ Firebase connection test successful'))
      .catch(err => console.error('❌ Firebase connection test failed:', err.message));
    
    module.exports = firebase;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.log('Using mock Firebase implementation due to initialization error');
  module.exports = createMockFirebase();
}
