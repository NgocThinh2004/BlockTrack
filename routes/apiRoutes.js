const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const User = require('../models/userModel');

// API để tìm người dùng theo email và vai trò
router.get('/users/find', isAuthenticated, async (req, res) => {
  try {
    const { email, role } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const user = await User.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (role && user.role !== role) {
      return res.status(400).json({ success: false, message: `User is not a ${role}` });
    }
    
    // Chỉ trả về những thông tin cần thiết
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error finding user:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API để tìm người dùng theo địa chỉ ví và vai trò
router.get('/users/find-by-wallet', isAuthenticated, async (req, res) => {
  try {
    const { wallet, role } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ success: false, message: 'Wallet address is required' });
    }
    
    const user = await User.getUserByWalletAddress(wallet);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (role && user.role !== role) {
      return res.status(400).json({ success: false, message: `User is not a ${role}` });
    }
    
    // Chỉ trả về những thông tin cần thiết
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error finding user by wallet:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
