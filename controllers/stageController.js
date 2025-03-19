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
    
    // Chỉ chủ sở hữu mới có thể thêm giai đoạn
    if (product.ownerId !== req.session.userId) {
      return res.status(403).render('error', { message: 'Bạn không có quyền thêm giai đoạn cho sản phẩm này' });
    }
    
    const stages = await ProductStage.getStagesByProductId(productId);
    
    res.render('stages/create', { 
      product, 
      stages,
      title: `Thêm giai đoạn: ${product.name}`
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
    
    // Chỉ chủ sở hữu mới có thể thêm giai đoạn
    if (product.ownerId !== req.session.userId) {
      return res.status(403).render('error', { message: 'Bạn không có quyền thêm giai đoạn cho sản phẩm này' });
    }
    
    const { stageName, description, location } = req.body;
    
    const stageData = {
      productId,
      stageName,
      description,
      location,
      handledBy: req.session.userId
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
