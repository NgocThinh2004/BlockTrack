/**
 * Middleware kiểm tra vai trò người dùng
 * - Phân quyền truy cập theo vai trò
 */

// Kiểm tra người dùng là nhà sản xuất
exports.isProducer = (req, res, next) => {
  if (req.user && req.user.role === 'producer') {
    next();
  } else {
    // Add debugging to help troubleshoot
    console.log('Role check failed', {
      hasUser: !!req.user,
      role: req.user ? req.user.role : 'no user'
    });
    
    res.status(403).render('error', {
      message: 'Chỉ nhà sản xuất mới có quyền truy cập tính năng này',
      title: 'Lỗi quyền truy cập'
    });
  }
};

// Kiểm tra người dùng là nhà phân phối
exports.isDistributor = (req, res, next) => {
  if (req.user && req.user.role === 'distributor') {
    next();
  } else {
    res.status(403).render('error', {
      message: 'Chỉ nhà phân phối mới có quyền truy cập tính năng này',
      title: 'Lỗi quyền truy cập'
    });
  }
};

// Kiểm tra người dùng là nhà bán lẻ
exports.isRetailer = (req, res, next) => {
  if (req.user && req.user.role === 'retailer') {
    next();
  } else {
    res.status(403).render('error', {
      message: 'Chỉ nhà bán lẻ mới có quyền truy cập tính năng này',
      title: 'Lỗi quyền truy cập'
    });
  }
};
