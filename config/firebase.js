const firebase = require('firebase/app');
require('firebase/firestore');
require('firebase/auth');
require('firebase/storage');

// Firebase configuration with your credentials
const firebaseConfig = {
  apiKey: "AIzaSyBeVGtmZ2kHGarTjP2JJ3DRQe9r9NJfe2M",
  authDomain: "blockchain-163b8.firebaseapp.com",
  projectId: "blockchain-163b8",
  storageBucket: "blockchain-163b8.firebasestorage.app",
  messagingSenderId: "444169440294",
  appId: "1:444169440294:web:8cc3fe5184bb015122aae7",
  measurementId: "G-NZW61GL88M"
};

// Initialize Firebase safely
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  } else {
    console.log('Firebase already initialized');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

module.exports = firebase;
