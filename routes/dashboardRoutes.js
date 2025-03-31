const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, loadUser } = require('../middlewares/auth');
const { isProducer, isDistributor, isRetailer } = require('../middlewares/roles');

/**
 * Routes xử lý dashboard cho từng vai trò
 */

// Điều hướng dựa trên vai trò
router.get('/', isAuthenticated, loadUser, (req, res) => {
  const role = req.user ? req.user.role : null; 
  
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
router.get('/producer', isAuthenticated, loadUser, isProducer, dashboardController.getProducerDashboard);

// Dashboard cho nhà phân phối
router.get('/distributor', isAuthenticated, loadUser, isDistributor, dashboardController.getDistributorDashboard);

// Dashboard cho nhà bán lẻ
router.get('/retailer', isAuthenticated, loadUser, isRetailer, dashboardController.getRetailerDashboard);

module.exports = router;
