const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stageController');
const { isAuthenticated, loadUser } = require('../middlewares/auth');

/**
 * Routes xử lý quản lý giai đoạn sản phẩm
 */

// Xem các giai đoạn của sản phẩm
router.get('/product/:productId', stageController.getProductStages);

// Thêm giai đoạn mới (chỉ chủ sở hữu)
router.get('/product/:productId/add', isAuthenticated, loadUser, stageController.showAddStageForm);
router.post('/product/:productId/add', isAuthenticated, loadUser, stageController.addStage);

module.exports = router;
