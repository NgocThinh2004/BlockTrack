const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const ensureDirs = require('./utils/ensureDirs');

// Đảm bảo Firebase đã được khởi tạo
const firebase = require('./config/firebase');

// Create Express app
const app = express();

// Ensure directories exist
ensureDirs();

// Cookie parser middleware
app.use(cookieParser());

// Configure session
const configureSession = require('./config/session');
configureSession(app);

// Add session debugging middleware
app.use((req, res, next) => {
  const originalRedirect = res.redirect;
  res.redirect = function(url) {
    console.log(`Redirecting to: ${url}`);
    originalRedirect.call(this, url);
  };
  
  console.log(`Session contains userId: ${!!req.session.userId}`);
  console.log(`Session contains user: ${!!req.session.user}`);
  
  next();
});

// Add after session middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Session data:`, {
      userId: req.session.userId,
      userRole: req.session.user?.role
    });
  }
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.originalUrl = req.originalUrl;
  next();
});

// Routes
try {
  const indexRoutes = require('./routes/index');
  const authRoutes = require('./routes/authRoutes');
  const productRoutes = require('./routes/productRoutes');
  const trackRoutes = require('./routes/trackRoutes');
  const stageRoutes = require('./routes/stageRoutes');

  app.use('/', indexRoutes);
  app.use('/auth', authRoutes);
  app.use('/products', productRoutes);
  app.use('/track', trackRoutes);
  app.use('/stages', stageRoutes);
  
  // Thêm route QR vào đây
  try {
    const qrRoutes = require('./routes/qrRoutes');
    app.use('/qr', qrRoutes);
    console.log('QR routes loaded successfully');
  } catch (err) {
    console.error('QR routes not loaded:', err.message);
  }
  
  // Optionally load other routes if they exist
  try {
    const dashboardRoutes = require('./routes/dashboardRoutes');
    app.use('/dashboard', dashboardRoutes);
    console.log('Dashboard routes loaded successfully');
  } catch (err) {
    console.log('Dashboard routes not loaded:', err.message);
  }
} catch (err) {
  console.error('Error loading routes:', err);
  // Provide a simple home route in case routes fail to load
  app.get('/', (req, res) => {
    res.render('home/index', { title: 'Home' });
  });
}

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
  console.error(err);
  res.status(err.status || 500).render('error', {
    title: 'Lỗi',
    message: err.message || 'Đã xảy ra lỗi',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;
