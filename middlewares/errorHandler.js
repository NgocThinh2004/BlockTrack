/**
 * Middleware xử lý lỗi tập trung
 */
const errorHandler = (err, req, res, next) => {
  // Log lỗi
  console.error(err.stack);

  // Trạng thái lỗi
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Định dạng thông điệp lỗi
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Đã xảy ra lỗi server' 
    : err.message;

  // Trả về lỗi dưới dạng JSON nếu là API request
  if (req.accepts('json') && !req.accepts('html')) {
    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  } 
  // Trả về trang lỗi HTML
  else {
    res.status(statusCode).render('error', {
      title: `Lỗi ${statusCode}`,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
};

module.exports = errorHandler;
