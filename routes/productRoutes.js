const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated } = require('../middlewares/auth');

/**
 * Routes xử lý quản lý sản phẩm
 */

// Xem danh sách sản phẩm
router.get('/', productController.getAllProducts);

// Tạo sản phẩm mới
router.get('/create', isAuthenticated, productController.showCreateForm);
router.post('/create', isAuthenticated, productController.createProduct);

// Xem chi tiết sản phẩm
router.get('/:id', productController.getProduct);

// Chỉnh sửa sản phẩm
router.get('/:id/edit', isAuthenticated, productController.showEditForm);
router.post('/:id/edit', isAuthenticated, productController.updateProduct);

module.exports = router;
