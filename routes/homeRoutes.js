const express = require('express');
const router = express.Router();

/**
 * Routes xử lý cho trang chủ và các trang chung
 */

// Trang chủ
router.get('/', (req, res) => {
  res.render('home/index', { 
    title: 'Trang chủ',
    hideFooter: false
  });
});

// Trang giới thiệu
router.get('/about', (req, res) => {
  res.render('home/about', { 
    title: 'Giới thiệu',
    hideFooter: false
  });
});

// Trang liên hệ 
router.get('/contact', (req, res) => {
  res.render('home/contact', { 
    title: 'Liên hệ',
    hideFooter: false 
  });
});

module.exports = router;
