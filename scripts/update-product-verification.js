const firebase = require('firebase/app');
require('firebase/firestore');
require('../config/firebase'); // Load firebase config
const crypto = require('crypto');

const productsCollection = firebase.firestore().collection('products');

/**
 * Tính toán hash từ dữ liệu sản phẩm
 */
function calculateProductHash(productData) {
  try {
    // Chuẩn bị ngày sản xuất để tính toán hash
    let productionDateStr = '';
    if (productData.productionDate) {
      if (productData.productionDate.toDate) {
        productionDateStr = productData.productionDate.toDate().toISOString().split('T')[0];
      } else if (productData.productionDate instanceof Date) {
        productionDateStr = productData.productionDate.toISOString().split('T')[0];
      } else if (typeof productData.productionDate === 'object' && productData.productionDate.seconds) {
        productionDateStr = new Date(productData.productionDate.seconds * 1000).toISOString().split('T')[0];
      } else {
        productionDateStr = new Date(productData.productionDate).toISOString().split('T')[0];
      }
    }
    
    // Chuẩn bị ngày hết hạn để tính toán hash
    let expiryDateStr = null;
    if (productData.expiryDate) {
      if (productData.expiryDate.toDate) {
        expiryDateStr = productData.expiryDate.toDate().toISOString().split('T')[0];
      } else if (productData.expiryDate instanceof Date) {
        expiryDateStr = productData.expiryDate.toISOString().split('T')[0];
      } else if (typeof productData.expiryDate === 'object' && productData.expiryDate.seconds) {
        expiryDateStr = new Date(productData.expiryDate.seconds * 1000).toISOString().split('T')[0];
      } else if (productData.expiryDate) {
        expiryDateStr = new Date(productData.expiryDate).toISOString().split('T')[0];
      }
    }
    
    // Chọn các trường quan trọng để tính hash
    const dataToHash = {
      name: productData.name,
      manufacturer: productData.manufacturer,
      origin: productData.origin,
      description: productData.description || '',
      batchNumber: productData.batchNumber || '',
      productionDate: productionDateStr,
      expiryDate: expiryDateStr
    };
    
    // Chuyển đối tượng thành chuỗi JSON đã sắp xếp để tính toán hash nhất quán
    const dataString = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());
    
    // Tính hash bằng thuật toán SHA-256
    return crypto.createHash('sha256').update(dataString).digest('hex');
  } catch (error) {
    console.error('Lỗi khi tính toán hash:', error);
    return crypto.createHash('sha256').update(productData.name || 'unknown').digest('hex');
  }
}

/**
 * Cập nhật trường verified cho tất cả sản phẩm
 */
async function updateProductVerification() {
  try {
    console.log('Bắt đầu cập nhật trường verified cho các sản phẩm...');
    
    // Lấy tất cả sản phẩm
    const snapshot = await productsCollection.get();
    let updatedCount = 0;
    
    // Cập nhật từng sản phẩm
    const batch = firebase.firestore().batch();
    
    for (const doc of snapshot.docs) {
      const product = doc.data();
      
      // Tính toán hash hiện tại
      const currentHash = calculateProductHash(product);
      
      // Thiết lập originalHash nếu chưa có
      const originalHash = product.originalHash || currentHash;
      
      // Xác định trạng thái verified
      const verified = currentHash === originalHash;
      
      // Thêm vào batch
      batch.update(doc.ref, { 
        originalHash: originalHash,
        currentHash: currentHash,
        verified: verified
      });
      
      updatedCount++;
      
      console.log(`Đã xử lý sản phẩm: ${product.name} (${doc.id}) - Verified: ${verified}`);
    }
    
    // Thực hiện cập nhật hàng loạt
    await batch.commit();
    
    console.log(`Đã cập nhật thành công ${updatedCount} sản phẩm`);
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi cập nhật trường verified:', error);
    process.exit(1);
  }
}

// Chạy hàm cập nhật
updateProductVerification();
