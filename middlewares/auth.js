const User = require('../models/userModel');

// Middleware xác thực người dùng

/**
 * Kiểm tra người dùng đã đăng nhập chưa
 * Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  res.redirect('/auth/login');
};

/**
 * Tải thông tin người dùng hiện tại
 */
exports.loadUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.getUserById(req.session.userId);
      
      if (user) {
        req.user = user;
        res.locals.user = user;
      }
    }
    next();
  } catch (error) {
    console.error('Error loading user:', error);
    next();
  }
};

// Kiểm tra người dùng có phải admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    message: 'Bạn không có quyền truy cập trang này',
    title: 'Lỗi quyền truy cập'
  });
};

// Middleware để kiểm tra vai trò 
exports.hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/auth/login');
    }
    
    const userRole = req.session.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    
    res.status(403).render('error', {
      message: 'Bạn không có quyền truy cập trang này',
      error: { status: 403 }
    });
  };
};
