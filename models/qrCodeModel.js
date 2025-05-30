const firebase = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const QRCodeService = require('../services/qrCodeService');
const Activity = require('./activityModel'); // Import Activity model

/**
 * QR Code model for managing product QR codes
 */
class QRCode {
  /**
   * Generate a QR code for a product
   * @param {string} productId - Product ID
   * @returns {Object} - QR code data
   */
  static async generateQRCode(productId) {
    try {
      const qrCodesCollection = firebase.firestore().collection('qrCodes');
      const qrId = uuidv4();
      
      // Tạo URL cho sản phẩm - URL này sẽ được mã hóa thành QR code
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const productUrl = `${baseUrl}/track/${productId}`;
      
      console.log('Creating QR code for product:', productId);
      console.log('Product URL for QR:', productUrl);
      
      // Kiểm tra xem sản phẩm đã có QR code chưa
      const existingQR = await this.getQRCodeByProductId(productId);
      if (existingQR) {
        console.log('QR code already exists for product:', productId);
        return existingQR;
      }
      
      // Sử dụng QRCodeService để tạo QR code
      const qrImageUrl = await QRCodeService.generate(productUrl);
      const qrDataUrl = await QRCodeService.generateDataUrl(productUrl);
      
      const qrCode = {
        id: qrId,
        productId: productId,
        qrImageUrl: qrImageUrl,
        qrDataUrl: qrDataUrl,
        productUrl: productUrl,
        scans: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Save to database
      await qrCodesCollection.doc(qrId).set(qrCode);
      console.log('QR code saved to database with ID:', qrId);
      
      // Ghi lại hoạt động nếu có ownerId
      const Product = require('./productModel'); // Import here to avoid circular dependency
      const product = await Product.getProductById(productId);
      if (product && product.ownerId) {
        try {
          await Activity.addActivity({
            userId: product.ownerId,
            type: 'qr_generated',
            entityId: qrId,
            entityName: product.name,
            entityType: 'qr',
            description: `Mã QR đã được tạo cho ${product.name}`
          });
          console.log('Đã thêm activity thành công khi tạo QR code');
          
          // Tạo một giai đoạn trong lịch sử sản phẩm khi tạo QR
          const ProductStage = require('./stageModel');
          const stageData = {
            productId: productId,
            stageName: 'qr_generated',
            description: 'Mã QR đã được tạo cho sản phẩm này',
            location: 'Hệ thống',
            handledBy: product.ownerId,
            skipActivityCreation: true // Thêm flag để không tạo hoạt động từ stage
          };
          
          // Thêm giai đoạn vào lịch sử sản phẩm và đưa lên blockchain
          await ProductStage.addStage(stageData);
          console.log('Đã thêm giai đoạn tạo QR vào lịch sử sản phẩm và blockchain');
        } catch (activityError) {
          console.error('Lỗi khi thêm activity hoặc stage cho QR code:', activityError);
        }
      } else {
        console.warn('Không tìm thấy product.ownerId khi tạo QR code:', productId);
      }
      
      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Không thể tạo mã QR: ' + error.message);
    }
  }
  
  /**
   * Get QR code by product ID
   * @param {string} productId - Product ID
   * @returns {Object|null} - QR code data
   */
  static async getQRCodeByProductId(productId) {
    try {
      const qrCodesCollection = firebase.firestore().collection('qrCodes');
      const snapshot = await qrCodesCollection
        .where('productId', '==', productId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }
  
  /**
   * Increment scan count for a QR code
   * @param {string} qrId - QR code ID
   * @returns {boolean} - Success status
   */
  static async incrementScanCount(qrId) {
    try {
      const qrCodesCollection = firebase.firestore().collection('qrCodes');
      await qrCodesCollection.doc(qrId).update({
        scans: firebase.firestore.FieldValue.increment(1),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing scan count:', error);
      throw error;
    }
  }
}

module.exports = QRCode;
