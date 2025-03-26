const firebase = require('firebase/app');
require('firebase/firestore');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * User model for authentication and profile management
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User information
   * @returns {Object} - Created user data
   */
  static async createUser(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user object
      const user = {
        id: uuidv4(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'consumer',
        address: userData.address || '',
        walletAddress: userData.walletAddress || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      await firebase.firestore()
        .collection('users')
        .doc(user.id)
        .set(user);
      
      // Remove password from returned user
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
      
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object|null} - User data or null
   */
  static async getUserByEmail(email) {
    try {
      if (!email) return null;
      
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('email', '==', email.toLowerCase())
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
      console.error('Error getting user by email:', error);
      return null;
    }
  }
  
  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Object|null} - User data or null
   */
  static async getUserById(id) {
    try {
      if (!id) return null;
      
      const doc = await firebase.firestore()
        .collection('users')
        .doc(id)
        .get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Get user by wallet address
   * @param {string} walletAddress - Blockchain wallet address
   * @returns {Object|null} - User data or null
   */
  static async getUserByWalletAddress(walletAddress) {
    try {
      if (!walletAddress) return null;
      
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('walletAddress', '==', walletAddress)
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
      console.error('Error getting user by wallet address:', error);
      return null;
    }
  }
  
  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} - Success status
   */
  static async updateUser(userId, updateData) {
    try {
      // Don't allow updating certain fields directly
      const { id, email, password, role, createdAt, ...allowedUpdates } = updateData;
      
      // Add update timestamp
      allowedUpdates.updatedAt = new Date().toISOString();
      
      await firebase.firestore()
        .collection('users')
        .doc(userId)
        .update(allowedUpdates);
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {boolean} - Password match status
   */
  static async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }
}

module.exports = User;
