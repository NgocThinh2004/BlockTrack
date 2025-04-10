const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Script tự động tạo các index cần thiết cho Firestore
 */
async function createFirestoreIndexes() {
  try {
    console.log('Bắt đầu tạo indexes cho Firestore...');
    
    // Index cho activities collection
    console.log('Tạo index cho activities collection (userId + timestamp desc)...');
    await admin.firestore().collection('activities').orderBy('userId').orderBy('timestamp', 'desc');
    
    // Index cho productStages collection
    console.log('Tạo index cho productStages collection (productId + timestamp asc)...');
    await admin.firestore().collection('productStages').orderBy('productId').orderBy('timestamp', 'asc');
    
    // Index cho products collection
    console.log('Tạo index cho products collection (ownerId + createdAt desc)...');
    await admin.firestore().collection('products').orderBy('ownerId').orderBy('createdAt', 'desc');
    
    console.log('Hoàn tất tạo indexes. Lưu ý bạn cần deploy indexes này lên Firebase.');
    
    // Tạo file hướng dẫn
    const instructions = `
# Hướng dẫn tạo index cho Firestore

Để ứng dụng hoạt động tốt, bạn cần tạo các index sau:

1. Collection: activities
   - Field: userId, Ascending
   - Field: timestamp, Descending

2. Collection: productStages
   - Field: productId, Ascending
   - Field: timestamp, Ascending

3. Collection: products
   - Field: ownerId, Ascending
   - Field: createdAt, Descending

Bạn có thể tạo indexes này thông qua Firebase Console hoặc sử dụng Firebase CLI với lệnh:
\`\`\`
firebase deploy --only firestore:indexes
\`\`\`

Sau khi tạo index, cần đợi vài phút để Firebase hoàn tất quá trình indexing.
`;

    fs.writeFileSync(path.join(__dirname, '../firestore-indexes.md'), instructions);
    console.log('Đã tạo file hướng dẫn tại: firestore-indexes.md');
    
  } catch (error) {
    console.error('Lỗi khi tạo indexes:', error);
  }
}

module.exports = createFirestoreIndexes;
