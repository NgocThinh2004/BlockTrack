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
        const { blockchainId, transactionHash } = await blockchainService.addProduct(product);
        product.blockchainId = blockchainId;
        product.blockchainTxId = transactionHash;
      } catch (blockchainError) {
        console.error('Error adding product to blockchain:', blockchainError);
        // Continue with saving to database even if blockchain fails
        // In production you might want to handle this differently
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
   * @returns {boolean} - Success status
   */
  static async transferOwnership(productId, newOwnerId) {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Record the transfer on blockchain
      try {
        const { transactionHash } = await blockchainService.transferProduct(
          product.blockchainId, 
          newOwnerId
        );
        
        // Update in database
        await productsCollection.doc(productId).update({
          ownerId: newOwnerId,
          blockchainTxId: transactionHash,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (blockchainError) {
        console.error('Error transferring product on blockchain:', blockchainError);
        
        // Fall back to just database update
        await productsCollection.doc(productId).update({
          ownerId: newOwnerId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
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
}

module.exports = Product;
