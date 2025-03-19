const firebase = require('firebase/app');
require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
const Product = require('./productModel');
const blockchainService = require('../services/blockchainService');

// Reference to stages collection
const stagesCollection = firebase.firestore().collection('productStages');

/**
 * ProductStage model handles tracking product stages through the supply chain
 */
class ProductStage {
  /**
   * Add a new stage to a product
   * @param {Object} stageData - Stage information
   * @returns {Object} - Created stage
   */
  static async addStage(stageData) {
    try {
      const stageId = uuidv4();
      
      // Prepare stage data
      const stage = {
        id: stageId,
        productId: stageData.productId,
        stageName: stageData.stageName,
        description: stageData.description,
        location: stageData.location,
        handledBy: stageData.handledBy,
        blockchainTxId: null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Record stage on blockchain
      try {
        const { transactionHash } = await blockchainService.addStage(stage);
        stage.blockchainTxId = transactionHash;
      } catch (blockchainError) {
        console.error('Error adding stage to blockchain:', blockchainError);
      }
      
      // Save stage to database
      await stagesCollection.doc(stageId).set(stage);
      
      // Update product's current stage
      await Product.updateProductStage(stageData.productId, stageData.stageName);
      
      return stage;
    } catch (error) {
      console.error('Error adding product stage:', error);
      throw error;
    }
  }
  
  /**
   * Get stages for a specific product
   * @param {string} productId - Product ID
   * @returns {Array} - List of stages
   */
  static async getStagesByProductId(productId) {
    try {
      const snapshot = await stagesCollection
        .where('productId', '==', productId)
        .orderBy('timestamp', 'asc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : null
        };
      });
    } catch (error) {
      console.error('Error getting product stages:', error);
      throw error;
    }
  }
  
  /**
   * Get the latest stage for a product
   * @param {string} productId - Product ID
   * @returns {Object|null} - Latest stage or null
   */
  static async getLatestStage(productId) {
    try {
      const snapshot = await stagesCollection
        .where('productId', '==', productId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate() : null
      };
    } catch (error) {
      console.error('Error getting latest stage:', error);
      throw error;
    }
  }
}

module.exports = ProductStage;
