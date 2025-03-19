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
        error: 'Email đã được sử dụng',
        formData: req.body,
        title: 'Đăng ký tài khoản'
      });
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
    const { email, password } = req.body;
    
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
  res.send('Update profile - Not implemented');
};

exports.connectWallet = async (req, res) => {
  res.send('Connect wallet - Not implemented');
};
