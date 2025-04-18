/**
 * Middleware để đảm bảo các biến mặc định luôn được truyền vào view
 */
const defaultVariables = (req, res, next) => {
  // Ghi đè phương thức render để tự động thêm các biến mặc định
  const originalRender = res.render;
  
  res.render = function(view, options = {}, callback) {
    // Đảm bảo options là đối tượng
    options = options || {};
    
    // Thêm các giá trị mặc định nếu chưa được đặt
    if (typeof options.title === 'undefined') {
      options.title = 'Hệ thống truy xuất nguồn gốc';
    }
    
    // Gọi phương thức render gốc
    originalRender.call(this, view, options, callback);
  };
  
  next();
};

module.exports = defaultVariables;
