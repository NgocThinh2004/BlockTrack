const User = require('../models/userModel');

/**
 * Middleware xác thực người dùng đơn giản hóa
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/auth/login');
};

// Kiểm tra người dùng có phải admin
exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', {
    message: 'Bạn không có quyền truy cập trang này',
    title: 'Lỗi quyền truy cập'
  });
};

// Kiểm tra vai trò
exports.hasRole = (roles) => {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) {
      return next();
    }
    res.status(403).render('error', {
      message: 'Bạn không có quyền truy cập trang này',
      title: 'Lỗi quyền truy cập'
    });
  };
};
