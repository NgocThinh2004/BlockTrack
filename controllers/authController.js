const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

/**
 * Controller xử lý các chức năng xác thực người dùng
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, address, walletAddress } = req.body;
    
    // Check if user already exists
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).render('auth/register', { 
        error: 'Email đã được sử dụng bởi tài khoản khác',
        formData: req.body,
        title: 'Đăng ký tài khoản'
      });
    }
    
    // Check if wallet address already exists (if provided)
    if (walletAddress) {
      const existingUserWithWallet = await User.getUserByWalletAddress(walletAddress);
      if (existingUserWithWallet) {
        return res.status(400).render('auth/register', { 
          error: 'Địa chỉ ví đã được liên kết với tài khoản khác',
          formData: req.body,
          title: 'Đăng ký tài khoản'
        });
      }
    }
    
    // Create new user
    const newUser = await User.createUser({
      name, email, password, role, address, walletAddress
    });
    
    // Save registration info to session for login page
    req.session.registerSuccess = true;
    req.session.registeredName = newUser.name;
    req.session.registeredEmail = newUser.email;
    req.session.registeredRole = newUser.role;
    
    // Redirect to login
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).render('auth/register', { 
      title: 'Đăng ký tài khoản',
      error: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.',
      formData: req.body
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;
    
    // Find user
    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Đăng nhập',
        error: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    // Verify password
    const passwordValid = await User.verifyPassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).render('auth/login', {
        title: 'Đăng nhập',
        error: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    // Kiểm tra xem có cần xác thực ví MetaMask không (cho vai trò khác consumer)
    if (user.role !== 'consumer') {
      // Nếu người dùng là producer, distributor hoặc retailer, bắt buộc phải xác thực ví
      if (!walletAddress) {
        return res.status(401).render('auth/login', {
          title: 'Đăng nhập',
          error: 'Vui lòng kết nối ví MetaMask để đăng nhập',
          requireWallet: true,
          userRole: user.role,
          email
        });
      }
      
      // Kiểm tra xem địa chỉ ví có trùng khớp không
      if (user.walletAddress && walletAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
        return res.status(401).render('auth/login', {
          title: 'Đăng nhập',
          error: 'Địa chỉ ví không khớp với tài khoản đã đăng ký',
          requireWallet: true,
          userRole: user.role,
          email,
          walletMismatch: true
        });
      }
    }
    
    // Store user in session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress
    };
    
    // Redirect based on role
    if (user.role === 'producer' || user.role === 'distributor' || user.role === 'retailer') {
      res.redirect('/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('auth/login', {
      title: 'Đăng nhập',
      error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.getUserById(req.session.userId);
    
    if (!user) {
      return res.redirect('/auth/login');
    }
    
    res.render('auth/profile', {
      title: 'Hồ sơ',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).render('error', {
      message: 'Đã xảy ra lỗi khi tải thông tin hồ sơ',
      error: {}
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, address } = req.body;
    
    // Cập nhật thông tin người dùng (không cho phép cập nhật walletAddress)
    await User.updateUser(userId, { name, address });
    
    // Lấy dữ liệu người dùng đã cập nhật
    const updatedUser = await User.getUserById(userId);
    
    res.render('auth/profile', {
      title: 'Hồ sơ',
      user: updatedUser,
      success: 'Thông tin hồ sơ đã được cập nhật thành công'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    const user = await User.getUserById(req.session.userId);
    res.status(500).render('auth/profile', {
      title: 'Hồ sơ',
      error: 'Đã xảy ra lỗi khi cập nhật hồ sơ',
      user
    });
  }
};

exports.connectWallet = async (req, res) => {
  res.send('Connect wallet - Not implemented');
};
