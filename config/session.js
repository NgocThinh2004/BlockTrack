const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const fs = require('fs');

/**
 * Cấu hình session cho ứng dụng
 */
const configureSession = (app) => {
  // Đảm bảo SECRET không bị rỗng
  const sessionSecret = process.env.SESSION_SECRET || 'blockchain_product_tracking_very_secure_secret_key';
  
  // Đảm bảo thư mục sessions tồn tại
  const sessionDir = path.join(__dirname, '..', 'sessions');
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log(`Đã tạo thư mục session: ${sessionDir}`);
  }
  
  // Cấu hình session cơ bản (sử dụng file store cho môi trường production)
  const sessionConfig = {
    secret: sessionSecret,
    resave: true, 
    saveUninitialized: true,
    cookie: {
      secure: false, // Sửa thành false nếu không dùng HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    },
    name: 'blockchain.sid'
  };

  // Sử dụng FileStore cho cả môi trường development và production
  console.log('Sử dụng FileStore cho session');
  sessionConfig.store = new FileStore({
    path: sessionDir,
    ttl: 86400, // 1 ngày (giây)
    retries: 0,
    logFn: () => {}
  });
  
  // Thêm middleware session
  app.use(session(sessionConfig));
  
  console.log('Session middleware đã được thiết lập');
};

module.exports = configureSession;
