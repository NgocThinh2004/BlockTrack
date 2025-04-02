const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middlewares/auth');

// Apply authentication middleware
router.use(isAuthenticated);

// Dashboard routes by role
router.get('/producer', dashboardController.getProducerDashboard);
router.get('/distributor', dashboardController.getDistributorDashboard);
router.get('/retailer', dashboardController.getRetailerDashboard);

// Default dashboard route
router.get('/', (req, res) => {
  // Get user role from session and redirect to appropriate dashboard
  const userRole = req.session.user?.role || 'consumer';
  
  console.log('Dashboard default route, user role:', userRole);
  
  if (userRole === 'producer') {
    return res.redirect('/dashboard/producer');
  } else if (userRole === 'distributor') {
    return res.redirect('/dashboard/distributor');
  } else if (userRole === 'retailer') {
    return res.redirect('/dashboard/retailer');
  } else {
    return res.redirect('/');
  }
});

module.exports = router;
