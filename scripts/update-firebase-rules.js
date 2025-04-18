/**
 * Script để cập nhật quy tắc bảo mật Firebase
 * 
 * Lưu ý: Script này chỉ hoạt động nếu bạn đã cài đặt Firebase CLI
 * và đã đăng nhập với lệnh: firebase login
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Tạo tệp quy tắc bảo mật tạm thời
const rulesContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc và ghi vào tất cả các bộ sưu tập chính
    match /users/{userId} {
      allow read, write: if true;
    }
    match /products/{productId} {
      allow read, write: if true;
    }
    match /productStages/{stageId} {
      allow read, write: if true;
    }
    match /qrCodes/{qrId} {
      allow read, write: if true;
    }
    match /activities/{activityId} {
      allow read, write: if true;
    }
    match /connectionTest/{docId} {
      allow read, write: if true;
    }
    
    // Cho phép đọc/ghi tất cả tài liệu khác - sẽ hết hạn vào 2025
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 4, 17);
    }
  }
}`;

const RULES_FILE_PATH = path.join(__dirname, 'firestore.rules');

async function updateFirebaseRules() {
  try {
    console.log('Cập nhật quy tắc bảo mật Firebase Firestore...');
    
    // Ghi file quy tắc tạm thời
    fs.writeFileSync(RULES_FILE_PATH, rulesContent);
    console.log('Đã tạo file quy tắc bảo mật tạm thời');
    
    // Để cập nhật quy tắc bảo mật, bạn cần phải đăng nhập vào Firebase CLI
    // và gọi lệnh deploy
    console.log('Bạn cần thực hiện các bước thủ công sau:');
    console.log('1. Cài đặt Firebase CLI: npm install -g firebase-tools');
    console.log('2. Đăng nhập: firebase login');
    console.log('3. Khởi tạo dự án: firebase init firestore (chọn dự án của bạn)');
    console.log('4. Sao chép nội dung sau vào file firestore.rules:');
    console.log('-------------------------------------------');
    console.log(rulesContent);
    console.log('-------------------------------------------');
    console.log('5. Triển khai quy tắc: firebase deploy --only firestore:rules');
    
    console.log('\nHoặc truy cập trang Firebase Console:');
    console.log('1. Mở https://console.firebase.google.com/project/blockchain-163b8/firestore/rules');
    console.log('2. Sao chép và dán quy tắc trên vào editor');
    console.log('3. Nhấp "Publish"');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật quy tắc Firebase:', error);
  } finally {
    // Xóa file tạm
    if (fs.existsSync(RULES_FILE_PATH)) {
      fs.unlinkSync(RULES_FILE_PATH);
    }
  }
}

// Thực thi script
updateFirebaseRules();
