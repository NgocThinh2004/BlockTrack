const firebase = require('firebase/app');
require('firebase/firestore');
const { v4: uuidv4 } = require('uuid');
const blockchainService = require('../services/blockchainService');

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
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }
  
  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Object|null} - Product data
   */
  static async getProductById(id) {
    try {
      const doc = await productsCollection.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting product:', error);
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
      const snapshot = await productsCollection
        .where('ownerId', '==', ownerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
