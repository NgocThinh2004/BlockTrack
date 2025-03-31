const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cookieParser = require('cookie-parser');
const ensureDirs = require('./utils/ensureDirs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Ensure directories exist
ensureDirs();

// Cookie parser middleware
app.use(cookieParser());

// Session configuration
const sessionConfig = {
  store: new FileStore({
    path: './sessions',
    ttl: 86400,
    retries: 0
  }),
  secret: process.env.SESSION_SECRET || 'blockchain-secure-secret',
  name: 'blocktrack.sid',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
};
app.use(session(sessionConfig));

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

  app.use('/', indexRoutes);
  app.use('/auth', authRoutes);
  app.use('/products', productRoutes);
  app.use('/track', trackRoutes);
  
  // Optionally load other routes if they exist
  try {
    const dashboardRoutes = require('./routes/dashboardRoutes');
    app.use('/dashboard', dashboardRoutes);
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
