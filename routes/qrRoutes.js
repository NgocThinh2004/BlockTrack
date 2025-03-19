const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { isAuthenticated } = require('../middlewares/auth');

/**
 * Routes xử lý mã QR
 */

// Tạo mã QR mới cho sản phẩm
router.get('/:productId/generate', isAuthenticated, qrController.generateQR);

// Xem mã QR
router.get('/:productId/view', qrController.viewQR);

// API để ghi nhận lượt quét mã QR
router.post('/:qrId/scan', qrController.incrementScan);

module.exports = router;
