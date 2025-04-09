const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { isAuthenticated } = require('../middlewares/auth');

// Routes cần xác thực
router.use(isAuthenticated);

// Kiểm tra và debug hoạt động
router.get('/debug', activityController.debugActivities);

// Thêm hoạt động test
router.post('/test-activity', activityController.addTestActivity);

module.exports = router;
