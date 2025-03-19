const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/userModel');
const routeLogger = require('./utils/routeLogger');
const ensureDirs = require('./utils/ensureDirs');
const cookieParser = require('cookie-parser');

// Tải biến môi trường
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Khởi tạo các thư mục cần thiết
ensureDirs();

// Sử dụng cookie-parser trước session
app.use(cookieParser());

// Kết nối Firebase
try {
  const firebase = require('./config/firebase');
  
  // Kiểm tra xem đây có phải Firebase thực không hay là mock
  if (firebase.apps && firebase.apps.length > 0) {
    console.log('✅ Firebase đã kết nối thành công:', firebase.apps[0].options.projectId);
  } else {
    console.warn('⚠️ Đang sử dụng Firebase mock. Dữ liệu sẽ không được lưu trữ.');
  }
} catch (error) {
  console.error('❌ Lỗi kết nối Firebase:', error.message);
}

// Cấu hình session sử dụng memory store (đơn giản hóa)
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'blockchain_secure_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static folder 
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// User middleware đơn giản hóa
app.use((req, res, next) => {
  res.locals.currentPath = req.originalUrl;
  res.locals.user = req.session.user || null;
  next();
});

// Routes cơ bản
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/track', require('./routes/trackRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server đang hoạt động' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Lỗi 404',
    message: 'Không tìm thấy trang bạn yêu cầu',
    error: { status: 404 }
  });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).render('error', {
    title: 'Lỗi',
    message: err.message || 'Đã xảy ra lỗi',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;
