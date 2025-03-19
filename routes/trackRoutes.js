const express = require('express');
const router = express.Router();
const trackController = require('../controllers/trackController');

/**
 * Routes xử lý truy xuất sản phẩm
 */
router.get('/', trackController.showTrackForm);
router.post('/search', trackController.searchProduct);
router.get('/:id', trackController.trackProduct);

module.exports = router;
