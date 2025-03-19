const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middlewares/auth');
const { isProducer, isDistributor, isRetailer } = require('../middlewares/roles');

/**
 * Routes xử lý dashboard cho từng vai trò
 */

// Điều hướng dựa trên vai trò
router.get('/', isAuthenticated, (req, res) => {
  const role = req.user.role; // Lấy role từ req.user đã được thiết lập trong middleware
  
  if (role === 'producer') {
    res.redirect('/dashboard/producer');
  } else if (role === 'distributor') {
    res.redirect('/dashboard/distributor');
  } else if (role === 'retailer') {
    res.redirect('/dashboard/retailer');
  } else {
    res.redirect('/');
  }
});

// Dashboard cho nhà sản xuất
router.get('/producer', isAuthenticated, isProducer, dashboardController.getProducerDashboard);

// Dashboard cho nhà phân phối
router.get('/distributor', isAuthenticated, isDistributor, dashboardController.getDistributorDashboard);

// Dashboard cho nhà bán lẻ
router.get('/retailer', isAuthenticated, isRetailer, dashboardController.getRetailerDashboard);

module.exports = router;
