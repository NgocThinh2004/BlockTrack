const firebase = require('firebase/app');
require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
const Product = require('./productModel');
const blockchainService = require('../services/blockchainService');
const Activity = require('./activityModel'); // Import Activity model

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
      
      // Ghi lại hoạt động
      const product = await Product.getProductById(stageData.productId);
      await Activity.addActivity({
        userId: stageData.handledBy,
        type: 'stage_added',
        entityId: stage.id,
        entityName: stage.stageName,
        entityType: 'stage',
        description: `${product ? product.name : 'Sản phẩm'} chuyển sang giai đoạn ${getStageName(stage.stageName)}`
      });
      
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
      let snapshot;
      let usingSortedQuery = true;
      
      try {
        // Thử truy vấn với sắp xếp (yêu cầu index)
        snapshot = await stagesCollection
          .where('productId', '==', productId)
          .orderBy('timestamp', 'asc')
          .get();
      } catch (error) {
        // Nếu lỗi do thiếu index, quay lại truy vấn đơn giản
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index not yet created for productStages, falling back to non-sorted query');
          console.warn('Please create the required index at: https://console.firebase.google.com/project/blockchain-163b8/firestore/indexes');
          snapshot = await stagesCollection
            .where('productId', '==', productId)
            .get();
          usingSortedQuery = false;
        } else {
          throw error; // Ném lại lỗi nếu không phải lỗi index
        }
      }
      
      let stages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : null
        };
      });
      
      // Nếu sử dụng truy vấn không có sắp xếp, sắp xếp kết quả trong bộ nhớ
      if (!usingSortedQuery) {
        stages.sort((a, b) => {
          // So sánh timestamp, xử lý cả khi timestamp là null
          const timeA = a.timestamp ? a.timestamp.getTime() : 0;
          const timeB = b.timestamp ? b.timestamp.getTime() : 0;
          return timeA - timeB; // Sắp xếp tăng dần
        });
      }
      
      return stages;
    } catch (error) {
      console.error('Error getting product stages:', error);
      throw error;
    }
  }
  
  /**
   * Get stages for a product
   * @param {string} productId - Product ID
   * @returns {Array} - List of stages
   */
  static async getStagesByProduct(productId) {
    try {
      const snapshot = await stagesCollection
        .where('productId', '==', productId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure proper timestamp conversion
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? (data.timestamp instanceof firebase.firestore.Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)) : null
        };
      });
    } catch (error) {
      console.error('Error getting stages by product:', error);
      return [];
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

// Helper function to get stage name in Vietnamese
function getStageName(stageName) {
  const stageNames = {
    'production': 'Sản xuất',
    'packaging': 'Đóng gói',
    'distribution': 'Vận chuyển',
    'retail': 'Bán lẻ',
    'sold': 'Đã bán'
  };
  return stageNames[stageName] || stageName;
}

module.exports = ProductStage;
