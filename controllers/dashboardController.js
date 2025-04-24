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
    const createdProducts = await Product.getProductsByCreator(userId); // Thêm lấy sản phẩm dựa trên creatorId
    const transferredProducts = await Product.getProductsTransferredBy(userId);
    
    // Kết hợp cả sản phẩm hiện tại và sản phẩm đã chuyển quyền sở hữu
    const productMap = new Map();
    
    // Thêm sản phẩm đã tạo vào map
    createdProducts.forEach(product => {
      productMap.set(product.id, product);
    });
    
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
    
    // Đếm số lượng sản phẩm theo giai đoạn - cập nhật cách tính
    const productsByStage = {
      production: products.filter(p => p.currentStage === 'production').length,
      packaging: products.filter(p => p.currentStage === 'packaging').length,
      qr_generated: products.filter(p => p.currentStage === 'qr_generated').length,
      distribution: 0 // Khởi tạo giá trị
    };
    
    // Tính số sản phẩm đang phân phối - bao gồm cả đã chuyển đi nhưng vẫn tính là "phân phối"
    try {
      // Lấy tất cả các giai đoạn phân phối và các sản phẩm đã chuyển cho nhà phân phối 
      // nhưng được tạo bởi nhà sản xuất hiện tại
      const stagesCollection = firebase.firestore().collection('productStages');
      const distributionStagesSnapshot = await stagesCollection
        .where('stageName', '==', 'distribution')
        .get();
      
      if (!distributionStagesSnapshot.empty) {
        // Lọc các sản phẩm thuộc về nhà sản xuất hiện tại
        const distributionProducts = new Set();
        
        for (const doc of distributionStagesSnapshot.docs) {
          const stageData = doc.data();
          const product = await Product.getProductById(stageData.productId);
          
          // Nếu sản phẩm được tạo bởi nhà sản xuất hiện tại
          if (product && product.creatorId === userId) {
            distributionProducts.add(stageData.productId);
          }
        }
        
        // Cập nhật số lượng sản phẩm trong giai đoạn phân phối
        productsByStage.distribution = distributionProducts.size;
      }
    } catch (error) {
      console.error('Error counting distribution stages:', error);
    }
    
    // Cập nhật tổng số sản phẩm - bao gồm cả các sản phẩm đang phân phối
    const productsCount = productsByStage.production + 
                          productsByStage.packaging + 
                          productsByStage.qr_generated + 
                          productsByStage.distribution;
    
    console.log(`[DASHBOARD] Distribution products: ${productsByStage.distribution}`);
    console.log(`[DASHBOARD] QR Generated products: ${productsByStage.qr_generated}`);

    // Lấy chính xác 5 hoạt động gần đây
    const activities = await Activity.getActivitiesByUser(userId, 5);
    console.log(`[DASHBOARD] Loaded ${activities ? activities.length : 0} activities for dashboard`);
    
    res.render('dashboard/producer', { 
      user,
      products,
      productsByStage,
      productsCount: productsCount, // Cập nhật cách tính tổng sản phẩm bao gồm cả QR
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
      sold: currentProducts.filter(p => p.currentStage === 'sold').length,
      pickup_confirmed: currentProducts.filter(p => p.currentStage === 'pickup_confirmed').length, // Thêm đếm sản phẩm giai đoạn lấy hàng thành công
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
