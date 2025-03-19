/**
 * Tiện ích để kiểm tra kết nối Firebase
 */
const firebase = require('../config/firebase');

async function testFirebaseConnection() {
  try {
    console.log('\n📋 FIREBASE CONNECTION TEST');
    console.log('-------------------------------');
    
    // Check if using mock Firebase
    const isMock = !firebase.apps || firebase.apps.length === 0;
    if (isMock) {
      console.log('❌ Đang sử dụng Firebase mock, không phải Firebase thực');
      console.log('💡 Kiểm tra lại thông tin cấu hình Firebase trong file .env');
      return false;
    }
    
    console.log('🔍 Kiểm tra kết nối đến Firebase project:', firebase.app().options.projectId);
    
    // Test write operation
    console.log('🔄 Kiểm tra thao tác ghi...');
    const writeRef = firebase.firestore().collection('connectionTest').doc('test');
    await writeRef.set({
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      message: 'Connection test',
      randomValue: Math.random().toString(36).substring(2)
    });
    console.log('✅ Ghi dữ liệu thành công');
    
    // Test read operation
    console.log('🔄 Kiểm tra thao tác đọc...');
    const docSnapshot = await writeRef.get();
    if (docSnapshot.exists) {
      console.log('✅ Đọc dữ liệu thành công:', docSnapshot.data().timestamp ? 'Có timestamp' : 'Không có timestamp');
    } else {
      console.log('❌ Không thể đọc dữ liệu đã ghi');
      return false;
    }
    
    console.log('✅ KẾT NỐI FIREBASE HOẠT ĐỘNG TỐT!');
    return true;
  } catch (error) {
    console.error('❌ LỖI KẾT NỐI FIREBASE:', error.message);
    console.log('💡 Các lý do có thể:');
    console.log('  - Thông tin cấu hình Firebase không chính xác');
    console.log('  - Quy tắc bảo mật Firestore không cho phép đọc/ghi');
    console.log('  - Vấn đề kết nối mạng');
    return false;
  }
}

// Export để có thể chạy trực tiếp hoặc import từ module khác
module.exports = testFirebaseConnection;

// Nếu được chạy trực tiếp (node firebaseTest.js)
if (require.main === module) {
  testFirebaseConnection()
    .then(success => {
      if (!success) process.exit(1);
    })
    .catch(err => {
      console.error('Test execution error:', err);
      process.exit(1);
    });
}
