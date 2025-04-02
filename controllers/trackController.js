const Product = require('../models/productModel');
const QRCode = require('../models/qrCodeModel');
const ProductStage = require('../models/stageModel');

/**
 * Controller cho trang truy xuất
 */
exports.showTrackForm = (req, res) => {
  res.render('track/form', { 
    title: 'Truy xuất sản phẩm',
    error: null
  });
};

exports.searchProduct = async (req, res) => {
  const { productId } = req.body;
  
  if (!productId) {
    return res.render('track/form', { 
      error: 'Vui lòng nhập ID sản phẩm',
      title: 'Truy xuất sản phẩm'
    });
  }
  
  res.redirect(`/track/${productId}`);
};

exports.trackProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    
    // Tìm sản phẩm trong database
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.render('track/form', {
        error: 'Không tìm thấy sản phẩm với ID đã nhập',
        title: 'Truy xuất sản phẩm'
      });
    }
    
    // Lấy lịch sử các giai đoạn
    const history = await ProductStage.getStagesByProductId(productId);
    
    // Lấy QR code nếu có
    const qrCode = await QRCode.getQRCodeByProductId(productId);
    
    res.render('track/product', {
      product,
      history: history || [],
      qrCode,
      title: `Truy xuất: ${product.name}`
    });
  } catch (error) {
    next(error);
  }
};
