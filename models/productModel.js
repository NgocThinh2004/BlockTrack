const firebase = require('firebase/app');
require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
const blockchainService = require('../services/blockchainService');
const Activity = require('./activityModel'); // Import Activity model

// Reference to products collection
const productsCollection = firebase.firestore().collection('products');

/**
 * Mô hình Product - xử lý thông tin sản phẩm
 * - Quản lý thông tin sản phẩm
 * - Kết nối với blockchain để lưu và xác thực thông tin
 */
class Product {
  /**
   * Create a new product
   * @param {Object} productData - Product information
   * @returns {Object} - Created product
   */
  static async createProduct(productData) {
    try {
      const productId = uuidv4();
      
      // Prepare product data
      const product = {
        id: productId,
        name: productData.name,
        manufacturer: productData.manufacturer,
        origin: productData.origin,
        description: productData.description || '',
        batchNumber: productData.batchNumber || '',
        productionDate: new Date(productData.productionDate),
        expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : null,
        ownerId: productData.ownerId,
        currentStage: 'production',
        blockchainId: null,
        blockchainTxId: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add product to blockchain
      try {
        console.log('Attempting to add product to blockchain...');
        // Use different variable names in destructuring to avoid redeclaration
        const { blockchainId: bcId, transactionHash } = await blockchainService.addProduct(product);
        
        console.log('Product successfully added to blockchain:', {
          blockchainId: bcId,
          transactionHash
        });
        
        product.blockchainId = bcId;
        product.blockchainTxId = transactionHash;
      } catch (blockchainError) {
        console.error('Error adding product to blockchain:', blockchainError);
        
        // Chỉ cần đánh dấu sản phẩm đang xử lý blockchain, người dùng có thể thử lại sau
        product.blockchainId = 'Đang xử lý';
        product.blockchainError = blockchainError.message;
      }
      
      // Save to database
      await productsCollection.doc(productId).set(product);
      
      // Ghi lại hoạt động
      await Activity.addActivity({
        userId: productData.ownerId,
        type: 'product_created',
        entityId: product.id,
        entityName: product.name,
        entityType: 'product',
        description: `Sản phẩm ${product.name} đã được tạo`
      });
      
      // Thêm hoạt động khi tạo sản phẩm mới
      try {
        await Activity.addActivity({
          userId: productData.ownerId,
          type: 'product_created',
          entityId: product.id,
          entityName: product.name,
          entityType: 'product',
          description: `Sản phẩm ${product.name} đã được tạo`
        });
        console.log('Đã ghi hoạt động tạo sản phẩm cho:', product.id);
      } catch (activityError) {
        console.error('Lỗi khi thêm hoạt động tạo sản phẩm:', activityError);
        // Không throw error để không ảnh hưởng đến việc tạo sản phẩm
      }
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }
  
  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Object|null} - Product or null if not found
   */
  static async getProductById(productId) {
    try {
      const doc = await productsCollection.doc(productId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
      
      // Convert Firestore Timestamps to JavaScript Date objects
      return {
        id: doc.id,
        ...data,
        productionDate: data.productionDate ? (data.productionDate instanceof firebase.firestore.Timestamp ? data.productionDate.toDate() : new Date(data.productionDate)) : null,
        expiryDate: data.expiryDate ? (data.expiryDate instanceof firebase.firestore.Timestamp ? data.expiryDate.toDate() : new Date(data.expiryDate)) : null,
        createdAt: data.createdAt ? (data.createdAt instanceof firebase.firestore.Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)) : null,
        updatedAt: data.updatedAt ? (data.updatedAt instanceof firebase.firestore.Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)) : null
      };
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get all products
   * @returns {Array} - List of products
   */
  static async getAllProducts() {
    try {
      const snapshot = await productsCollection.orderBy('createdAt', 'desc').get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  }
  
  /**
   * Update product information
   * @param {string} id - Product ID
   * @param {Object} updates - Updated product data
   * @returns {boolean} - Success status
   */
  static async updateProduct(id, updates) {
    try {
      const product = await this.getProductById(id);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      const updateData = {
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Update product on blockchain
      try {
        const { transactionHash } = await blockchainService.updateProduct({
          blockchainId: product.blockchainId,
          ...updateData
        });
        
        updateData.blockchainTxId = transactionHash;
      } catch (blockchainError) {
        console.error('Error updating product on blockchain:', blockchainError);
      }
      
      // Update in database
      await productsCollection.doc(id).update(updateData);
      
      // Ghi lại hoạt động nếu có ownerId
      if (updates.ownerId) {
        await Activity.addActivity({
          userId: updates.ownerId,
          type: 'product_updated',
          entityId: id,
          entityName: updates.name || 'Sản phẩm',
          entityType: 'product',
          description: `Sản phẩm ${updates.name || id} đã được cập nhật`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }
  
  /**
   * Update product stage
   * @param {string} id - Product ID
   * @param {string} stage - New stage name
   * @returns {boolean} - Success status
   */
  static async updateProductStage(id, stage) {
    try {
      await productsCollection.doc(id).update({
        currentStage: stage,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating product stage:', error);
      throw error;
    }
  }
  
  /**
   * Transfer product ownership
   * @param {string} productId - Product ID
   * @param {string} newOwnerId - ID of the new owner
   * @param {string} transferReason - Lý do chuyển quyền sở hữu
   * @param {string} receiverLocation - Địa chỉ người nhận
   * @returns {boolean} - Success status
   */
  static async transferOwnership(productId, newOwnerId, transferReason = '', receiverLocation = '') {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Lưu thông tin chủ sở hữu cũ
      const previousOwnerId = product.ownerId;
      
      // Tìm thông tin người nhận nếu có
      let receiverData = {
        receiverLocation: receiverLocation
      };
      
      try {
        const User = require('./userModel');
        const receiver = await User.getUserById(newOwnerId);
        if (receiver) {
          receiverData = {
            ...receiverData,
            receiverName: receiver.name,
            receiverRole: receiver.role,
            receiverAddress: receiverLocation || receiver.address || 'N/A'
          };
          
          // Cập nhật trạng thái dựa trên vai trò người nhận
          if (receiver.role === 'distributor') {
            newStage = 'distribution';
          } else if (receiver.role === 'retailer') {
            newStage = 'retail';
          }
        }
      } catch (e) {
        console.warn('Could not get receiver information:', e);
      }
      
      // Record the transfer on blockchain
      let blockchainResult = null;
      try {
        blockchainResult = await blockchainService.transferProduct(
          product.blockchainId, 
          newOwnerId
        );
        
        console.log('Ownership transferred on blockchain:', blockchainResult);
      } catch (blockchainError) {
        console.error('Error transferring product on blockchain:', blockchainError);
      }
      
      // Update in database
      const updateData = {
        ownerId: newOwnerId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add blockchain transaction hash if available
      if (blockchainResult && blockchainResult.transactionHash) {
        updateData.blockchainTxId = blockchainResult.transactionHash;
      }
      
      // Cập nhật trạng thái sản phẩm nếu xác định được vai trò người nhận
      if (newStage) {
        updateData.currentStage = newStage;
      }
      
      await productsCollection.doc(productId).update(updateData);
      
      // Thêm giai đoạn chuyển quyền sở hữu vào lịch sử sản phẩm
      try {
        const ProductStage = require('./stageModel');
        await ProductStage.addTransferStage(productId, previousOwnerId, newOwnerId, transferReason, receiverData, newStage);
      } catch (stageError) {
        console.error('Error adding transfer stage:', stageError);
      }
      
      // Ghi nhật ký hoạt động cho người chuyển
      await Activity.addActivity({
        userId: previousOwnerId,
        type: 'ownership_transferred',
        entityId: productId,
        entityName: product.name,
        entityType: 'product',
        description: `Đã chuyển quyền sở hữu sản phẩm "${product.name}" cho ${receiverData.receiverName || 'người dùng khác'}`
      });
      
      // Ghi nhật ký hoạt động cho người nhận
      await Activity.addActivity({
        userId: newOwnerId,
        type: 'ownership_received',
        entityId: productId,
        entityName: product.name,
        entityType: 'product',
        description: `Đã nhận quyền sở hữu sản phẩm "${product.name}"`
      });
      
      return true;
    } catch (error) {
      console.error('Error transferring product ownership:', error);
      throw error;
    }
  }
  
  /**
   * Get products by owner ID
   * @param {string} ownerId - Owner's user ID
   * @returns {Array} - List of products
   */
  static async getProductsByOwner(ownerId) {
    try {
      let snapshot;
      let usingSortedQuery = true;
      
      try {
        // Try with sorting first (requires index)
        snapshot = await productsCollection
          .where('ownerId', '==', ownerId)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (error) {
        // If index error occurs, fall back to simple query without sorting
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index not yet created, falling back to non-sorted query');
          console.warn('Please create the required index at: https://console.firebase.google.com/project/blockchain-163b8/firestore/indexes');
          snapshot = await productsCollection
            .where('ownerId', '==', ownerId)
            .get();
          usingSortedQuery = false;
        } else {
          throw error; // Re-throw if it's not an index error
        }
      }
      
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If we had to use the fallback query, sort the results in memory
      if (!usingSortedQuery) {
        products.sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
      }
      
      return products;
    } catch (error) {
      console.error('Error getting products by owner:', error);
      throw error;
    }
  }
  
  /**
   * Get products by manufacturer
   * @param {string} manufacturerId - Manufacturer's user ID
   * @returns {Array} - List of products
   */
  static async getProductsByManufacturer(manufacturerId) {
    const snapshot = await productsCollection.where('ownerId', '==', manufacturerId).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Search products by name, manufacturer or ID
   * @param {string} query - Search query
   * @returns {Array} - Matching products
   */
  static async searchProducts(query) {
    try {
      // First try to find by exact ID
      const productById = await this.getProductById(query);
      if (productById) {
        return [productById];
      }
      
      // Then try to find by blockchain ID
      const snapshotByBlockchainId = await productsCollection
        .where('blockchainId', '==', query)
        .get();
        
      if (!snapshotByBlockchainId.empty) {
        return snapshotByBlockchainId.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Finally, search by name containing the query
      // Note: This is not efficient for large databases, consider using a search service
      const snapshot = await productsCollection.get();
      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.manufacturer.toLowerCase().includes(query.toLowerCase())
        );
        
      return results;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Thử lại đưa sản phẩm lên blockchain khi lần đầu gặp lỗi
   * @param {string} productId - ID sản phẩm
   * @returns {Object} - Kết quả với trạng thái thành công hoặc lỗi
   */
  static async retryBlockchain(productId) {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new Error('Không tìm thấy sản phẩm');
      }
      
      // Chỉ cho phép thử lại nếu sản phẩm đang trong trạng thái "Đang xử lý" hoặc null
      if (product.blockchainId && product.blockchainId !== 'Đang xử lý') {
        return {
          success: false,
          error: 'Sản phẩm này đã được xác thực trên blockchain'
        };
      }
      
      // Thử lại kết nối blockchain
      const { blockchainId, transactionHash } = await blockchainService.addProduct(product);
      
      // Cập nhật thông tin sản phẩm
      await productsCollection.doc(productId).update({
        blockchainId: blockchainId,
        blockchainTxId: transactionHash,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        blockchainId,
        transactionHash
      };
    } catch (error) {
      console.error('Error retrying blockchain connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get products transferred by a specific user (for dashboard statistics)
   * @param {string} userId - User ID who transferred the products
   * @returns {Array} - List of transferred products
   */
  static async getProductsTransferredBy(userId) {
    try {
      // Truy vấn các giai đoạn chuyển giao quyền sở hữu của người dùng
      const stagesCollection = firebase.firestore().collection('productStages');
      
      // Lấy cả giai đoạn chuyển quyền sở hữu và giai đoạn chuyển sang distribution
      const transferStagesSnapshot = await stagesCollection
        .where('previousOwnerId', '==', userId)
        .get();
      
      if (transferStagesSnapshot.empty) {
        return [];
      }
      
      // Lọc các giai đoạn liên quan đến chuyển quyền sở hữu hoặc chuyển sang distribution
      const relevantStages = transferStagesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.stageName === 'ownership_transfer' || 
               data.stageName === 'distribution';
      });
      
      if (relevantStages.length === 0) {
        return [];
      }
      
      // Lấy các sản phẩm IDs từ các giai đoạn chuyển nhượng
      const productIds = [...new Set(relevantStages.map(doc => doc.data().productId))];
      
      // Nếu không có ID sản phẩm, trả về mảng rỗng
      if (productIds.length === 0) {
        return [];
      }
      
      // Lấy thông tin các sản phẩm đã chuyển
      const transferredProducts = [];
      for (const productId of productIds) {
        const product = await this.getProductById(productId);
        if (product) {
          transferredProducts.push(product);
        }
      }
      
      return transferredProducts;
    } catch (error) {
      console.error('Error getting transferred products:', error);
      return [];
    }
  }

  /**
   * Chuyển quyền sở hữu qua đơn vị vận chuyển và đến người nhận cuối
   * @param {string} productId - ID sản phẩm
   * @param {string} distributorId - ID đơn vị vận chuyển
   * @param {string} finalRecipientId - ID người nhận cuối (nhà bán lẻ)
   * @param {string} transferReason - Lý do chuyển
   * @param {Object} additionalData - Dữ liệu bổ sung
   * @returns {boolean} - Success status
   */
  static async transferWithShipping(productId, distributorId, finalRecipientId, transferReason = '', additionalData = {}) {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Lưu thông tin chủ sở hữu cũ
      const previousOwnerId = product.ownerId;
      
      // Chuẩn bị dữ liệu nhà phân phối
      let receiverData = {
        receiverName: additionalData.distributorName || 'Đơn vị vận chuyển',
        receiverRole: 'distributor',
        receiverLocation: additionalData.location || 'N/A',
        finalRecipientId: finalRecipientId,
        finalRecipientName: additionalData.finalRecipientName || 'Nhà bán lẻ'
      };
      
      // Record the transfer on blockchain
      let blockchainResult = null;
      try {
        blockchainResult = await blockchainService.transferProduct(
          product.blockchainId, 
          distributorId
        );
        
        console.log('Ownership transferred on blockchain:', blockchainResult);
      } catch (blockchainError) {
        console.error('Error transferring product on blockchain:', blockchainError);
      }
      
      // Update in database
      const updateData = {
        ownerId: distributorId,
        currentStage: 'distribution',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        finalRecipientId: finalRecipientId // Lưu thông tin người nhận cuối
      };
      
      // Add blockchain transaction hash if available
      if (blockchainResult && blockchainResult.transactionHash) {
        updateData.blockchainTxId = blockchainResult.transactionHash;
      }
      
      await productsCollection.doc(productId).update(updateData);
      
      // Thêm giai đoạn chuyển quyền sở hữu vào lịch sử sản phẩm
      try {
        const ProductStage = require('./stageModel');
        await ProductStage.addTransferStage(
          productId, 
          previousOwnerId, 
          distributorId, 
          transferReason, 
          receiverData, 
          'distribution'
        );
      } catch (stageError) {
        console.error('Error adding transfer stage:', stageError);
      }
      
      // Ghi nhật ký hoạt động cho người chuyển
      await Activity.addActivity({
        userId: previousOwnerId,
        type: 'ownership_transferred',
        entityId: productId,
        entityName: product.name,
        entityType: 'product',
        description: `Đã chuyển sản phẩm "${product.name}" qua đơn vị vận chuyển ${receiverData.receiverName}`
      });
      
      // Ghi nhật ký hoạt động cho người nhận
      await Activity.addActivity({
        userId: distributorId,
        type: 'ownership_received',
        entityId: productId,
        entityName: product.name,
        entityType: 'product',
        description: `Đã nhận sản phẩm "${product.name}" để vận chuyển đến ${receiverData.finalRecipientName}`
      });
      
      // Thông báo cho người nhận cuối (nếu có)
      if (finalRecipientId) {
        await Activity.addActivity({
          userId: finalRecipientId,
          type: 'product_shipping',
          entityId: productId,
          entityName: product.name,
          entityType: 'product',
          description: `Sản phẩm "${product.name}" đang được vận chuyển đến bạn`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error transferring with shipping:', error);
      throw error;
    }
  }

  /**
   * Hoàn tất giao hàng đến người nhận cuối
   * @param {string} productId - ID sản phẩm
   * @param {string} finalRecipientId - ID người nhận cuối
   * @param {Object} deliveryData - Dữ liệu giao hàng
   * @returns {boolean} - Success status
   */
  static async completeDelivery(productId, finalRecipientId, deliveryData = {}) {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Lưu thông tin chủ sở hữu cũ (nhà phân phối)
      const previousOwnerId = product.ownerId;
      
      // Chuẩn bị dữ liệu người nhận cuối
      let receiverData = {
        receiverName: 'Nhà bán lẻ',
        receiverRole: 'retailer',
        receiverLocation: deliveryData.location || 'N/A',
        deliveryNotes: deliveryData.notes || ''
      };
      
      // Lấy thông tin người nhận
      try {
        const User = require('./userModel');
        const receiver = await User.getUserById(finalRecipientId);
        if (receiver) {
          receiverData.receiverName = receiver.name;
        }
      } catch (e) {
        console.warn('Could not get final recipient information:', e);
      }
      
      // Record the transfer on blockchain
      let blockchainResult = null;
      try {
        blockchainResult = await blockchainService.transferProduct(
          product.blockchainId, 
          finalRecipientId
        );
        
        console.log('Final delivery completed on blockchain:', blockchainResult);
      } catch (blockchainError) {
        console.error('Error transferring product on blockchain:', blockchainError);
      }
      
      // Update in database
      const updateData = {
        ownerId: finalRecipientId,
        currentStage: 'retail', // Giai đoạn bán lẻ
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        finalRecipientId: null // Xóa trường này vì đã chuyển xong
      };
      
      // Add blockchain transaction hash if available
      if (blockchainResult && blockchainResult.transactionHash) {
        updateData.blockchainTxId = blockchainResult.transactionHash;
      }
      
      await productsCollection.doc(productId).update(updateData);
      
      // Thêm giai đoạn chuyển quyền sở hữu vào lịch sử sản phẩm
      try {
        const ProductStage = require('./stageModel');
        await ProductStage.addTransferStage(
          productId, 
          previousOwnerId, 
          finalRecipientId, 
          'Hoàn tất giao hàng', 
          receiverData, 
          'retail'
        );
      } catch (stageError) {
        console.error('Error adding delivery stage:', stageError);
      }
      
      // Ghi nhật ký hoạt động cho nhà phân phối
      await Activity.addActivity({
        userId: previousOwnerId,
        type: 'delivery_completed',
        entityId: productId,
        entityName: product.name,
        entityType: 'product',
        description: `Đã giao sản phẩm "${product.name}" cho ${receiverData.receiverName}`
      });
      
      // Ghi nhật ký hoạt động cho người nhận cuối
      await Activity.addActivity({
        userId: finalRecipientId,
        type: 'product_received',
        entityId: productId,
        entityName: product.name,
        entityType: 'product',
        description: `Đã nhận sản phẩm "${product.name}" từ đơn vị vận chuyển`
      });
      
      return true;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  }
}

module.exports = Product;