const firebase = require('firebase/app');
require('firebase/firestore');
require('firebase/auth');
require('firebase/storage');

// Cấu hình Firebase - lấy từ file .env hoặc sử dụng giá trị cố định nếu không có
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBeVGtmZ2kHGarTjP2JJ3DRQe9r9NJfe2M",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "blockchain-163b8.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "blockchain-163b8",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "blockchain-163b8.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "444169440294",
  appId: process.env.FIREBASE_APP_ID || "1:444169440294:web:8cc3fe5184bb015122aae7",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-NZW61GL88M"
};

// Khởi tạo Firebase một cách an toàn
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  } else {
    console.log('Firebase already initialized');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.error('Stack trace:', error.stack);
}

module.exports = firebase;
