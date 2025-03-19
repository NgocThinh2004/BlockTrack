const firebase = require('firebase/app');
require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
const QRCodeService = require('../services/qrCodeService');

// Reference to QR codes collection
const qrCodesCollection = firebase.firestore().collection('qrCodes');

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
      // Check if QR code already exists
      const existingQR = await this.getQRCodeByProductId(productId);
      if (existingQR) {
        return existingQR;
      }
      
      // Create a new QR code ID
      const qrId = uuidv4();
      
      // Generate the URL for tracking
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const trackUrl = `${baseUrl}/track/${productId}`;
      
      // Generate QR code image
      const qrImageUrl = await QRCodeService.generate(trackUrl);
      
      // Create QR code data
      const qrCode = {
        id: qrId,
        productId,
        qrImageUrl,
        trackUrl,
        scans: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Save to database
      await qrCodesCollection.doc(qrId).set(qrCode);
      
      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }
  
  /**
   * Get QR code by product ID
   * @param {string} productId - Product ID
   * @returns {Object|null} - QR code data
   */
  static async getQRCodeByProductId(productId) {
    try {
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
