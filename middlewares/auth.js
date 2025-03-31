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

/**
 * Middleware để tải thông tin người dùng và gắn vào request
 * Đặt middleware này sau isAuthenticated để đảm bảo có userId
 */
exports.loadUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.getUserById(req.session.userId);
      if (user) {
        req.user = user;
        // Đồng thời làm cho user có sẵn cho views thông qua res.locals
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

// Kiểm tra vai trò
exports.hasRole = (roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    res.status(403).render('error', {
      message: 'Bạn không có quyền truy cập trang này',
      title: 'Lỗi quyền truy cập'
    });
  };
};
