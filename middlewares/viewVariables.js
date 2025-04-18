/**
 * Middleware để đảm bảo các biến mặc định cho views
 */
module.exports = function(req, res, next) {
  // Lưu hàm render gốc
  const originalRender = res.render;
  
  // Ghi đè hàm render để tự động cung cấp biến title nếu không có
  res.render = function(view, options, callback) {
    // Xử lý trường hợp options không được cung cấp
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Đảm bảo options luôn là một object
    options = options || {};
    
    // Tạo locals nếu chưa có
    res.locals = res.locals || {};
    
    // Đặt biến title nếu chưa có trong options và locals
    if (!options.title && !res.locals.title) {
      res.locals.title = 'Hệ thống truy xuất nguồn gốc';
    }
    
    // Gọi hàm render gốc
    originalRender.call(this, view, options, callback);
  };
  
  next();
};
