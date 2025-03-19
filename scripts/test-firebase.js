/**
 * Script kiểm tra kết nối Firebase
 * Sử dụng: node scripts/test-firebase.js
 */
require('dotenv').config();
const testFirebaseConnection = require('../utils/firebaseTest');

console.log('🔥 KIỂM TRA KẾT NỐI FIREBASE');
console.log('==============================');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID || 'Không có');

testFirebaseConnection()
  .then(result => {
    if (result) {
      console.log('\n✅ Kết nối Firebase hoạt động bình thường!');
      console.log('Bạn có thể tiếp tục sử dụng BlockTrack với Firebase thực.');
    } else {
      console.log('\n❌ Kết nối Firebase thất bại!');
      console.log('Hệ thống sẽ chuyển sang sử dụng Firebase mock.');
    }
  })
  .catch(err => {
    console.error('\n❌ Lỗi trong quá trình kiểm tra:', err);
  });
