const Product = require('../models/productModel');
const User = require('../models/userModel');
const Activity = require('../models/activityModel'); // Import Activity model

/**
 * Controller xử lý hiển thị dashboard cho từng vai trò
 * - Dashboard nhà sản xuất
 * - Dashboard nhà phân phối
 * - Dashboard nhà bán lẻ
 */

// Rename function to match route reference if needed
exports.getProducerDashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    console.log('[DASHBOARD] Producer dashboard requested by userId:', userId);
    
    if (!userId) {
      console.log('[DASHBOARD] No userId in session, redirecting to login');
      return res.redirect('/auth/login');
    }
    
    const user = await User.getUserById(userId);
    
    if (!user || user.role !== 'producer') {
      console.log('[DASHBOARD] Access denied: User is not a producer');
      return res.status(403).redirect('/auth/login');
    }
    
    // Lấy sản phẩm từ database
    const products = await Product.getProductsByOwner(userId);
    console.log(`[DASHBOARD] Found ${products.length} products for user ${userId}`);
    
    // Đếm số lượng sản phẩm theo giai đoạn
    const productsByStage = {
      production: products.filter(p => p.currentStage === 'production').length,
      packaging: products.filter(p => p.currentStage === 'packaging').length,
      distribution: products.filter(p => p.currentStage === 'distribution').length,
      retail: products.filter(p => p.currentStage === 'retail').length,
      sold: products.filter(p => p.currentStage === 'sold').length
    };
    
    // Lấy hoạt động gần đây với số lượng tăng lên
    // Lấy 15 hoạt động để có dữ liệu dự phòng, nhưng view chỉ hiển thị 5
    const activities = await Activity.getActivitiesByUser(userId, 15);
    console.log(`[DASHBOARD] Loaded ${activities.length} activities for dashboard`);
    
    res.render('dashboard/producer', { 
      user,
      products,
      productsByStage,
      productsCount: products.length,
      activities,
      title: 'Nhà sản xuất Dashboard'
    });
  } catch (error) {
    console.error('[DASHBOARD] Error in producer dashboard:', error);
    next(error);
  }
};

// Tương tự cập nhật cho getDistributorDashboard và getRetailerDashboard
exports.getDistributorDashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    console.log('Distributor dashboard requested by userId:', userId);
    const user = await User.getUserById(userId);
    
    if (!user || user.role !== 'distributor') {
      console.log('Access denied: User is not a distributor');
      return res.status(403).redirect('/auth/login');
    }
    
    // Lấy sản phẩm từ database
    const products = await Product.getProductsByOwner(userId);
    
    // Đếm số lượng sản phẩm theo giai đoạn
    const productsByStage = {
      inTransit: products.filter(p => p.currentStage === 'distribution').length,
      delivered: products.filter(p => !['distribution', 'in_transit'].includes(p.currentStage)).length
    };
    
    // Lấy hoạt động gần đây của người dùng (15 để dự phòng, view chỉ hiển thị 5)
    const activities = await Activity.getActivitiesByUser(userId, 15);
    
    res.render('dashboard/distributor', { 
      user,
      products,
      productsByStage,
      productsCount: products.length,
      activities,
      title: 'Nhà phân phối Dashboard'
    });
  } catch (error) {
    console.error('Error in distributor dashboard:', error);
    next(error);
  }
};

exports.getRetailerDashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    console.log('Retailer dashboard requested by userId:', userId);
    const user = await User.getUserById(userId);
    
    if (!user || user.role !== 'retailer') {
      console.log('Access denied: User is not a retailer');
      return res.status(403).redirect('/auth/login');
    }
    
    // Lấy sản phẩm từ database
    const products = await Product.getProductsByOwner(userId);
    
    // Đếm số lượng sản phẩm theo giai đoạn
    const productsByStage = {
      inStock: products.filter(p => p.currentStage === 'retail').length,
      sold: products.filter(p => p.currentStage === 'sold').length
    };
    
    // Lấy hoạt động gần đây của người dùng (15 để dự phòng, view chỉ hiển thị 5)
    const activities = await Activity.getActivitiesByUser(userId, 15);
    
    res.render('dashboard/retailer', { 
      user,
      products,
      productsByStage,
      productsCount: products.length,
      activities,
      title: 'Nhà bán lẻ Dashboard'
    });
  } catch (error) {
    console.error('Error in retailer dashboard:', error);
    next(error);
  }
};

exports.getConsumerDashboard = async (req, res) => {
  res.redirect('/');
};
