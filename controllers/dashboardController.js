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
    const currentProducts = await Product.getProductsByOwner(userId);
    const transferredProducts = await Product.getProductsTransferredBy(userId);
    
    // Kết hợp cả sản phẩm hiện tại và sản phẩm đã chuyển quyền sở hữu
    const productMap = new Map();
    
    // Thêm sản phẩm đã chuyển giao vào map
    transferredProducts.forEach(product => {
      productMap.set(product.id, product);
    });
    
    // Thêm sản phẩm hiện tại vào map (sẽ ghi đè sản phẩm đã chuyển nếu trùng id)
    currentProducts.forEach(product => {
      productMap.set(product.id, product);
    });
    
    // Chuyển map thành mảng
    const products = Array.from(productMap.values());
    
    // Sắp xếp theo thời gian tạo giảm dần (mới nhất lên đầu)
    products.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    
    console.log(`[DASHBOARD] Found ${products.length} total products (${currentProducts.length} current, ${transferredProducts.length} transferred) for user ${userId}`);
    
    // Đếm số lượng sản phẩm theo giai đoạn
    const productsByStage = {
      production: currentProducts.filter(p => p.currentStage === 'production').length,
      packaging: currentProducts.filter(p => p.currentStage === 'packaging').length,
      qr_generated: currentProducts.filter(p => p.currentStage === 'qr_generated').length,
      distribution: 0 // Sẽ được cập nhật bên dưới
    };
    
    // Phương pháp 1: Đếm trực tiếp từ các sản phẩm đã chuyển giao
    const distributionProducts = transferredProducts.filter(p => p.currentStage === 'distribution');
    productsByStage.distribution = distributionProducts.length;
    console.log(`[DASHBOARD] Distribution products: ${productsByStage.distribution}`);
    console.log(`[DASHBOARD] QR Generated products: ${productsByStage.qr_generated}`);

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
    
    // Lấy chính xác 5 hoạt động gần đây
    const activities = await Activity.getActivitiesByUser(userId, 5);
    console.log(`[DASHBOARD] Loaded ${activities ? activities.length : 0} activities for dashboard`);
    
    res.render('dashboard/producer', { 
      user,
      products,
      productsByStage,
      productsCount: productsByStage.production + productsByStage.packaging + productsByStage.qr_generated + productsByStage.distribution, // Cập nhật cách tính tổng sản phẩm bao gồm cả QR
      activities: activities || [], // Đảm bảo luôn có một mảng, tránh lỗi
      title: 'Nhà sản xuất Dashboard'
    });
  } catch (error) {
    console.error('[DASHBOARD] Error in producer dashboard:', error);
    next(error);
  }
};

/**
 * Hiển thị dashboard cho nhà phân phối
 */
exports.getDistributorDashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    let inProgressProducts = [];
    let deliveredProducts = [];
    
    // Lấy danh sách sản phẩm cho nhà phân phối
    try {
      if (typeof Product.getProductsByDistributor === 'function') {
        // Sử dụng phương thức chuyên biệt nếu có
        inProgressProducts = await Product.getProductsByDistributor(userId, 'in_progress');
        deliveredProducts = await Product.getProductsByDistributor(userId, 'delivered');
      } else {
        // Fallback: Sử dụng phương thức chung
        console.log('Phương thức getProductsByDistributor không tồn tại, sử dụng phương thức thay thế');
        
        // Lấy sản phẩm đang vận chuyển (nhà phân phối đang sở hữu)
        inProgressProducts = await Product.getProductsByOwner(userId);
        
        // Lọc sản phẩm để chỉ lấy các sản phẩm đang trong quá trình vận chuyển
        inProgressProducts = inProgressProducts.filter(p => p.finalRecipientId);
        
        // Lấy sản phẩm đã giao (nhà phân phối đã chuyển quyền sở hữu)
        deliveredProducts = await Product.getProductsWithCondition(
          'deliveredBy', 
          '==', 
          userId
        );
      }
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm cho dashboard:', error);
      inProgressProducts = [];
      deliveredProducts = [];
    }
    
    // Lấy hoạt động gần đây
    const activities = await Activity.getActivitiesByUser(userId, 10);
    
    // Tính toán các số liệu thống kê
    const stats = {
      inProgressCount: inProgressProducts.length,
      deliveredCount: deliveredProducts.length,
      producerCount: 0,
      totalScans: 0
    };
    
    // Render trang dashboard với dữ liệu đã chuẩn bị
    res.render('dashboard/distributor', {
      title: 'Dashboard Nhà phân phối',
      inProgressProducts,
      deliveredProducts,
      activities,
      stats
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
    
    // Lấy sản phẩm từ database - kết hợp cả hiện tại và đã chuyển
    const currentProducts = await Product.getProductsByOwner(userId);
    const transferredProducts = await Product.getProductsTransferredBy(userId);
    
    // Kết hợp sản phẩm
    const productMap = new Map();
    transferredProducts.forEach(product => {
      productMap.set(product.id, product);
    });
    currentProducts.forEach(product => {
      productMap.set(product.id, product);
    });
    const products = Array.from(productMap.values());
    
    // Sắp xếp theo thời gian tạo giảm dần
    products.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    
    // Đếm số lượng sản phẩm theo giai đoạn - chỉ đếm sản phẩm hiện tại
    const productsByStage = {
      inStock: currentProducts.filter(p => p.currentStage === 'retail').length,
      qr_generated: currentProducts.filter(p => p.currentStage === 'qr_generated').length,
      sold: currentProducts.filter(p => p.currentStage === 'sold').length
    };

    console.log(`[DASHBOARD] QR Generated products: ${productsByStage.qr_generated}`);
    
    // Lấy chính xác 5 hoạt động gần đây
    const activities = await Activity.getActivitiesByUser(userId, 5);
    console.log(`[DASHBOARD] Loaded ${activities ? activities.length : 0} activities for retailer dashboard`);
    
    res.render('dashboard/retailer', { 
      user,
      products,
      productsByStage,
      productsCount: currentProducts.length,
      activities: activities || [],
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
