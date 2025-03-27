const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');

/**
 * Routes xử lý xác thực và quản lý người dùng
 */

// Đăng ký
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Đăng ký tài khoản' });
});
router.post('/register', authController.register);

// Đăng nhập
router.get('/login', (req, res) => {
  // Lấy thông tin đăng ký thành công từ session
  const registerSuccess = req.session.registerSuccess || false;
  const registeredName = req.session.registeredName || '';
  const registeredEmail = req.session.registeredEmail || '';
  const registeredRole = req.session.registeredRole || '';
  
  // Xóa thông tin session sau khi sử dụng
  delete req.session.registerSuccess;
  delete req.session.registeredName;
  delete req.session.registeredEmail;
  delete req.session.registeredRole;

  // Nếu có thông tin về vai trò là producer, distributor, retailer, thì yêu cầu kết nối ví
  let requireWallet = false;
  if (registeredRole && registeredRole !== 'consumer') {
    requireWallet = true;
  }
  
  res.render('auth/login', { 
    title: 'Đăng nhập', 
    error: null,
    registerSuccess,
    registeredName,
    registeredEmail,
    registeredRole,
    requireWallet,
    userRole: registeredRole
  });
});
router.post('/login', authController.login);

// Đăng xuất
router.get('/logout', authController.logout);

// Hồ sơ người dùng
router.get('/profile', isAuthenticated, authController.getProfile);
router.post('/profile', isAuthenticated, authController.updateProfile);

// Kết nối ví
router.post('/connect-wallet', isAuthenticated, authController.connectWallet);

module.exports = router;
