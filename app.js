const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
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

// Thêm middleware xử lý biến views trước khi sử dụng các route
const viewVariables = require('./middlewares/viewVariables');
app.use(viewVariables);

// Thêm middleware biến mặc định
const defaultVariables = require('./middlewares/defaultVariables');
app.use(defaultVariables);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser
app.use(cookieParser(process.env.SESSION_SECRET || 'your-secret-key'));

// Session configuration - phải đặt TRƯỚC flash middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages - đảm bảo đặt SAU session middleware
app.use(flash());

// Make flash messages available to templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.warning_msg = req.flash('warning');
  res.locals.info_msg = req.flash('info');
  next();
});

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
  const qrRoutes = require('./routes/qrRoutes');
  const activityRoutes = require('./routes/activityRoutes'); // Thêm dòng này
  const apiRoutes = require('./routes/apiRoutes');
  
  app.use('/', indexRoutes);
  app.use('/auth', authRoutes);
  app.use('/products', productRoutes);
  app.use('/track', trackRoutes);
  app.use('/stages', stageRoutes);
  app.use('/qr', qrRoutes);
  app.use('/activity', activityRoutes); // Thêm dòng này
  app.use('/api', apiRoutes);
  
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
