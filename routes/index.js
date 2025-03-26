const express = require('express');
const router = express.Router();

/**
 * Route xử lý trang chủ và các trang chung
 */
router.get('/', (req, res) => {
  res.render('home/index', {
    title: 'Truy xuất nguồn gốc sản phẩm qua Blockchain',
    hideFooter: false
  });
});

// Thêm route test để kiểm tra hình ảnh
router.get('/image-test', (req, res) => {
  res.render('image-test', { title: 'Image Test' });
});

module.exports = router;
