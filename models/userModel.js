const firebase = require('../config/firebase');  // Use configured Firebase instance
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * User model for authentication and profile management
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.walletAddress = data.walletAddress || null;
    this.address = data.address || null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

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
      
      // Normalize wallet address if provided
      const walletAddress = userData.walletAddress ? 
        userData.walletAddress.toLowerCase() : '';
      
      // Create user object
      const user = {
        id: uuidv4(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'consumer',
        address: userData.address || '',
        walletAddress: walletAddress,
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
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Object|null} - User data or null if not found
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
      
      return new User({
        id: doc.id,
        ...doc.data()
      });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      // For development, use demo accounts
      if (process.env.NODE_ENV === 'development') {
        if (id.includes('producer')) return this.getDemoUser('producer');
        if (id.includes('distributor')) return this.getDemoUser('distributor');
        if (id.includes('retailer')) return this.getDemoUser('retailer');
      }
      return null;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object|null} - User data or null if not found
   */
  static async getUserByEmail(email) {
    try {
      if (!email) return null;
      
      console.log(`Looking up user by email: ${email}`);
      
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('email', '==', email.toLowerCase())
        .get();
      
      if (snapshot.empty) {
        console.log('User not found by email');
        return null;
      }
      
      console.log('User found by email');
      const userData = snapshot.docs[0].data();
      
      return new User({
        id: snapshot.docs[0].id,
        ...userData
      });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
  
  /**
   * Get demo user for development
   */
  static getDemoUser(role) {
    return new User({
      id: `demo-${role}-123`,
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      email: `${role}@example.com`,
      password: '$2a$10$XQxevrpLSHW4UlWaXQUkOuPfFfKYgvHRGxrLd3SK9jGZB.c.7BHEW', // "password"
      role: role,
      walletAddress: '0x1234567890123456789012345678901234567890',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get user by wallet address
   * @param {string} walletAddress - Blockchain wallet address
   * @returns {Object|null} - User data or null
   */
  static async getUserByWalletAddress(walletAddress) {
    try {
      if (!walletAddress) return null;
      
      // Always normalize wallet addresses for comparison
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('walletAddress', '==', normalizedWalletAddress)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      return new User({
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      });
    } catch (error) {
      console.error('Error getting user by wallet address:', error);
      return null;
    }
  }

  /**
   * Check if email is already registered
   * @param {string} email - Email to check
   * @returns {boolean} - True if email exists
   */
  static async emailExists(email) {
    if (!email) return false;
    
    try {
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('email', '==', email.toLowerCase())
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Email exists check error:', error);
      throw error; // Throw the error instead of failing silently
    }
  }

  /**
   * Check if wallet address is already registered
   * @param {string} walletAddress - Wallet address to check
   * @returns {boolean} - True if wallet exists
   */
  static async walletExists(walletAddress) {
    if (!walletAddress) return false;
    
    try {
      // Always normalize wallet addresses for comparison 
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('walletAddress', '==', normalizedWalletAddress)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Wallet exists check error:', error);
      throw error; // Throw the error instead of failing silently
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
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  static async updatePassword(userId, newPassword) {
    try {
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password in database
      await firebase.firestore()
        .collection('users')
        .doc(userId)
        .update({
          password: hashedPassword,
          updatedAt: new Date().toISOString()
        });
      
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Array} - List of users
   */
  static async getUsersByRole(role) {
    try {
      const snapshot = await firebase.firestore()
        .collection('users')
        .where('role', '==', role)
        .get();
      
      if (snapshot.empty) {
        return [];
      }
      
      return snapshot.docs.map(doc => new User(doc.data()));
    } catch (error) {
      console.error('Get users by role error:', error);
      return [];
    }
  }
}

module.exports = User;
