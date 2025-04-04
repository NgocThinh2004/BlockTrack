const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, loadUser } = require('../middlewares/auth');
const { isProducer } = require('../middlewares/roles');

/**
 * Routes xử lý quản lý sản phẩm
 */

// Xem danh sách sản phẩm
router.get('/', productController.getAllProducts);

// Tạo sản phẩm mới
router.get('/create', isAuthenticated, loadUser, isProducer, productController.showCreateForm);
router.post('/create', isAuthenticated, loadUser, isProducer, productController.createProduct);

// Xem chi tiết sản phẩm
router.get('/:id', productController.getProduct);

// Chỉnh sửa sản phẩm
router.get('/:id/edit', isAuthenticated, loadUser, productController.showEditForm);
router.post('/:id/edit', isAuthenticated, loadUser, productController.updateProduct);

// Thử lại kết nối blockchain
router.post('/:id/retry-blockchain', isAuthenticated, loadUser, productController.retryBlockchain);

// Chuyển quyền sở hữu sản phẩm
router.post('/:id/transfer', isAuthenticated, productController.transferOwnership);

module.exports = router;
