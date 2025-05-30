const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

/**
 * Controller xử lý xác thực người dùng
 */
exports.getLogin = (req, res) => {
  // Xác định xem có cần kiểm tra vai trò từ query param không
  const roleFromQuery = req.query.role;
  const requireWallet = roleFromQuery && ['producer', 'distributor', 'retailer'].includes(roleFromQuery);
  
  res.render('auth/login', {
    title: 'Đăng nhập',
    error: req.query.error || null,
    redirectToLogin: false,
    requireWallet: requireWallet,
    userRole: roleFromQuery
  });
};

/**
 * Xử lý đăng nhập người dùng
 */
exports.postLogin = async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;
    
    console.log(`Login attempt for email: ${email}, wallet provided: ${walletAddress ? 'yes' : 'no'}`);
    
    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: 'Vui lòng nhập email và mật khẩu',
        email
      });
    }
    
    // Tìm người dùng bằng email
    const user = await User.getUserByEmail(email);
    
    if (!user) {
      console.log(`Login failed: User with email ${email} not found`);
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: 'Email hoặc mật khẩu không chính xác',
        email
      });
    }
    
    // So sánh mật khẩu - Đảm bảo xử lý đúng cách khi so sánh bất đồng bộ với bcrypt
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error('Password comparison error:', err);
    }
    
    if (!isMatch) {
      console.log(`Login failed: Incorrect password for ${email}`);
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: 'Email hoặc mật khẩu không chính xác',
        email
      });
    }
    
    // Kiểm tra xem ví có bắt buộc dựa trên vai trò không
    const requiresWallet = user.role === 'producer' || user.role === 'distributor' || user.role === 'retailer';
    
    // Nếu ví bắt buộc và đã cung cấp địa chỉ, xác minh xem có khớp không
    if (requiresWallet && user.walletAddress && walletAddress) {
      if (walletAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
        console.log(`Login failed: Wallet address mismatch for ${email}`);
        return res.render('auth/login', {
          title: 'Đăng nhập',
          error: 'Địa chỉ ví không khớp với tài khoản đã đăng ký',
          requireWallet: true,
          userRole: user.role,
          email,
          walletMismatch: true,
          registeredWalletAddress: `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
        });
      }
      
      console.log(`Wallet verification successful for ${email}`);
    }
    
    // Đăng nhập thành công, lưu thông tin người dùng vào session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      role: user.role,
      walletAddress: user.walletAddress
    };
    
    console.log(`Login successful for ${email}`);
    
    // Chuyển hướng ngay lập tức không cần đợi lưu session
    if (user.role === 'producer') {
      return res.redirect('/dashboard/producer');
    } else if (user.role === 'distributor') {
      return res.redirect('/dashboard/distributor');
    } else if (user.role === 'retailer') {
      return res.redirect('/dashboard/retailer');
    } else {
      return res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('auth/login', { 
      title: 'Đăng nhập',
      error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Xử lý đăng ký người dùng
 */
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, role, address, walletAddress } = req.body;
    
    // Kiểm tra cơ bản
    if (password !== passwordConfirm) {
      return res.status(400).render('auth/register', {
        title: 'Đăng ký tài khoản',
        error: 'Mật khẩu xác nhận không khớp',
        formData: req.body
      });
    }
    
    // Kiểm tra email đã tồn tại chưa
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      console.log(`Registration failed: Email ${email} already exists`);
      return res.status(400).render('auth/register', {
        title: 'Đăng ký tài khoản',
        error: 'Email đã được sử dụng bởi tài khoản khác',
        formData: req.body
      });
    }
    
    // Kiểm tra ví đã tồn tại chưa (nếu được cung cấp)
    if (walletAddress) {
      const walletExists = await User.walletExists(walletAddress);
      if (walletExists) {
        console.log(`Registration failed: Wallet address ${walletAddress} already exists`);
        return res.status(400).render('auth/register', {
          title: 'Đăng ký tài khoản',
          error: 'Địa chỉ ví đã được liên kết với tài khoản khác',
          formData: req.body
        });
      }
    }
    
    // Tạo người dùng mới
    const newUser = await User.createUser({
      name, email, password, role, address, walletAddress
    });
    
    // Lưu thông tin đăng ký vào session
    req.session.registerSuccess = true;
    req.session.registeredName = newUser.name;
    req.session.registeredEmail = newUser.email;
    req.session.registeredRole = newUser.role;
    
    // Chuyển hướng đến trang đăng nhập
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

exports.logout = (req, res) => {
  // Đặt một cờ trong cookie phản hồi để chỉ ra rằng ví nên ngắt kết nối
  res.cookie('wallet_disconnected', 'true', { 
    maxAge: 5000, // Cookie tồn tại ngắn, chỉ để chuyển hướng
    httpOnly: false // Làm cho nó có thể truy cập bởi JS phía client
  });
  
  // Lưu email người dùng cuối cùng vào cookie riêng để phát hiện thay đổi người dùng
  if (req.session.user && req.session.user.email) {
    res.cookie('last_user', req.session.user.email, {
      maxAge: 86400000, // 24 giờ
      httpOnly: false
    });
  }
  
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
    
    // Cập nhật thông tin người dùng trong session
    req.session.user = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      walletAddress: updatedUser.walletAddress
    };
    
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
      user,
      error: 'Đã xảy ra lỗi khi cập nhật hồ sơ'
    });
  }
};

// Thêm chức năng đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Lấy dữ liệu người dùng
    const user = await User.getUserById(userId);
    
    if (!user) {
      return res.redirect('/auth/login');
    }
    
    // Xác thực mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.render('auth/profile', {
        title: 'Hồ sơ',
        user,
        passwordError: 'Mật khẩu hiện tại không chính xác'
      });
    }
    
    // Kiểm tra mật khẩu mới và xác nhận khớp nhau
    if (newPassword !== confirmPassword) {
      return res.render('auth/profile', {
        title: 'Hồ sơ',
        user,
        passwordError: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
      });
    }
    
    // Cập nhật mật khẩu mới
    await User.updatePassword(userId, newPassword);
    
    res.render('auth/profile', {
      title: 'Hồ sơ',
      user,
      passwordSuccess: 'Mật khẩu đã được thay đổi thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    const user = await User.getUserById(req.session.userId);
    res.status(500).render('auth/profile', {
      title: 'Hồ sơ',
      user,
      passwordError: 'Đã xảy ra lỗi khi thay đổi mật khẩu'
    });
  }
};

exports.connectWallet = async (req, res) => {
  res.send('Connect wallet - Not implemented');
};