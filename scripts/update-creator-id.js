const firebase = require('firebase/app');
require('firebase/firestore');
require('../config/firebase'); // Load firebase config

const productsCollection = firebase.firestore().collection('products');

async function updateCreatorIds() {
  try {
    console.log('Bắt đầu cập nhật creatorId cho các sản phẩm...');
    
    // Lấy tất cả sản phẩm không có creatorId
    const snapshot = await productsCollection.get();
    let updatedCount = 0;
    
    // Cập nhật từng sản phẩm
    const batch = firebase.firestore().batch();
    
    snapshot.forEach(doc => {
      const product = doc.data();
      if (!product.creatorId) {
        // Nếu không có creatorId, sử dụng ownerId hiện tại làm creatorId
        batch.update(doc.ref, { 
          creatorId: product.ownerId 
        });
        updatedCount++;
      }
    });
    
    // Thực hiện cập nhật hàng loạt
    await batch.commit();
    
    console.log(`Đã cập nhật thành công ${updatedCount} sản phẩm`);
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi cập nhật creatorId:', error);
    process.exit(1);
  }
}

// Chạy hàm cập nhật
updateCreatorIds();
