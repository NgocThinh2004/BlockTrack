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
      distribution: 0 // Sẽ được cập nhật bên dưới
    };
    
    // Lấy tất cả sản phẩm đã từng thuộc về người dùng này để đếm sản phẩm đã giao cho vận chuyển
    let transferredProducts = [];
    try {
      transferredProducts = await Product.getProductsTransferredBy(userId);
      console.log(`[DASHBOARD] Found ${transferredProducts.length} transferred products for user ${userId}`);
    } catch (error) {
      console.error('Error fetching transferred products:', error);
      transferredProducts = [];
    }
    
    // Phương pháp 1: Đếm trực tiếp từ các sản phẩm đã chuyển giao
    // Lọc các sản phẩm hiện đang ở trạng thái "distribution"
    const distributionProducts = transferredProducts.filter(p => p.currentStage === 'distribution');
    productsByStage.distribution = distributionProducts.length;
    console.log(`[DASHBOARD] Distribution products: ${productsByStage.distribution}`);

    // Phương pháp 2: Kiểm tra từ bảng giai đoạn sản phẩm (nếu số lượng vẫn không chính xác)
    if (productsByStage.distribution === 0) {
      try {
        // Truy vấn trực tiếp từ bảng productStages
        const stagesCollection = firebase.firestore().collection('productStages');
        const distributionStagesSnapshot = await stagesCollection
          .where('previousOwnerId', '==', userId)
          .where('stageName', '==', 'distribution')
          .get();
        
        // Lấy số lượng các sản phẩm đã chuyển sang giai đoạn vận chuyển
        const distributionStagesCount = distributionStagesSnapshot.empty ? 0 : distributionStagesSnapshot.size;
        productsByStage.distribution = Math.max(productsByStage.distribution, distributionStagesCount);
        console.log(`[DASHBOARD] Distribution stages count: ${distributionStagesCount}`);
      } catch (error) {
        console.error('Error counting distribution stages:', error);
      }
    }
    
    // Lấy hoạt động gần đây với số lượng tăng lên
    // Lấy 15 hoạt động để có dữ liệu dự phòng, nhưng view chỉ hiển thị 5
    const activities = await Activity.getActivitiesByUser(userId, 15);
    console.log(`[DASHBOARD] Loaded ${activities.length} activities for dashboard`);
    
    res.render('dashboard/producer', { 
      user,
      products,
      productsByStage,
      productsCount: products.length,
      activities: activities || [],
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
