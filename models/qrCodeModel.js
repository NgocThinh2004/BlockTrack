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
      // Fix: Sử dụng đường dẫn tương đối để tránh vấn đề với domain
      const productUrl = `/track/${productId}`;
      
      console.log('Creating QR code for product:', productId);
      console.log('Product URL for QR:', productUrl);
      
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
        await Activity.addActivity({
          userId: product.ownerId,
          type: 'qr_generated',
          entityId: qrId,
          entityName: product.name,
          entityType: 'qr',
          description: `Mã QR đã được tạo cho ${product.name}`
        });
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
