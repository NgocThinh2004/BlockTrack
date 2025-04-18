const ProductStage = require('../models/stageModel');
const Product = require('../models/productModel');

/**
 * Controller xử lý các chức năng quản lý giai đoạn sản phẩm
 * - Thêm các giai đoạn mới cho sản phẩm
 * - Theo dõi quá trình vận chuyển và sản xuất
 */
exports.showAddStageForm = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    // Kiểm tra quyền truy cập (Debug)
    console.log('Quyền sản phẩm - debug:', {
      currentUserId: req.user?.id || 'không có user',
      productOwnerId: product.ownerId,
      userRole: req.user?.role,
      currentStage: product.currentStage,
      isOwner: req.user?.id === product.ownerId
    });
    
    // Chỉ chủ sở hữu mới có thể thêm giai đoạn
    if (!req.user || product.ownerId !== req.user.id) {
      return res.status(403).render('error', { message: 'Bạn không có quyền thêm giai đoạn cho sản phẩm này' });
    }
    
    // Sửa đổi: Logic kiểm tra vai trò và giai đoạn mở rộng hơn
    let canAddStage = false;
    
    // Nếu là chủ sở hữu, mở rộng quyền thêm giai đoạn
    if (req.user.role === 'producer') {
      // Nhà sản xuất có thể thêm giai đoạn cho hầu hết các trạng thái
      canAddStage = ['production', 'packaging', 'qr_generated', 'distribution'].includes(product.currentStage);
    } 
    else if (req.user.role === 'distributor') {
      // Nhà phân phối có thể thêm giai đoạn cho sản phẩm trong quá trình vận chuyển
      canAddStage = ['packaging', 'qr_generated', 'distribution'].includes(product.currentStage);
    }
    else if (req.user.role === 'retailer') {
      // Nhà bán lẻ có thể thêm giai đoạn cho sản phẩm đã nhận hoặc chuẩn bị bán
      canAddStage = ['distribution', 'retail', 'qr_generated'].includes(product.currentStage);
    }
    
    if (!canAddStage) {
      return res.status(403).render('error', { 
        message: 'Sản phẩm ở trạng thái hiện tại không thể thêm giai đoạn mới. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.' 
      });
    }
    
    const stages = await ProductStage.getStagesByProductId(productId);
    
    res.render('stages/create', { 
      product, 
      stages,
      title: `Thêm giai đoạn: ${product.name}`,
      userRole: req.user.role
    });
  } catch (error) {
    next(error);
  }
};

exports.addStage = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    // Kiểm tra quyền truy cập (Debug)
    console.log('Quyền sản phẩm (addStage) - debug:', {
      currentUserId: req.user?.id || 'không có user',
      productOwnerId: product.ownerId,
      sessionUserId: req.session.userId,
      isOwner: req.user?.id === product.ownerId
    });
    
    // Chỉ chủ sở hữu mới có thể thêm giai đoạn
    if (!req.user || product.ownerId !== req.user.id) {
      return res.status(403).render('error', { message: 'Bạn không có quyền thêm giai đoạn cho sản phẩm này' });
    }
    
    const { stageName, description, location } = req.body;
    
    const stageData = {
      productId,
      stageName,
      description,
      location,
      handledBy: req.user.id // Sử dụng req.user.id thay vì req.session.userId
    };
    
    await ProductStage.addStage(stageData);
    
    res.redirect(`/products/${productId}`);
  } catch (error) {
    next(error);
  }
};

exports.getProductStages = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    const stages = await ProductStage.getStagesByProductId(productId);
    
    res.render('stages/index', { 
      product, 
      stages,
      title: `Giai đoạn sản phẩm: ${product.name}` 
    });
  } catch (error) {
    next(error);
  }
};
