const QRCode = require('../models/qrCodeModel');
const Product = require('../models/productModel');
const ProductStage = require('../models/stageModel');

/**
 * Controller xử lý các chức năng liên quan đến QR code
 * - Tạo mã QR cho sản phẩm
 * - Hiển thị và quản lý mã QR
 */
exports.generateQR = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { 
        title: 'Lỗi',
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    
    // Chỉ chủ sở hữu mới có thể tạo mã QR
    if (product.ownerId !== req.session.userId) {
      return res.status(403).render('error', { 
        title: 'Lỗi quyền truy cập',
        message: 'Bạn không có quyền tạo mã QR cho sản phẩm này' 
      });
    }
    
    // Kiểm tra sản phẩm đã có mã QR chưa
    const existingQR = await QRCode.getQRCodeByProductId(productId);
    if (existingQR) {
      return res.redirect(`/qr/${productId}/view`);
    }
    
    // Kiểm tra sản phẩm đã qua giai đoạn đóng gói chưa
    const stages = await ProductStage.getStagesByProductId(productId);
    const hasPackagingStage = stages.some(stage => stage.stageName === 'packaging');
    
    if (!hasPackagingStage) {
      return res.status(400).render('error', { 
        title: 'Lỗi quy trình',
        message: 'Sản phẩm phải được đóng gói (packaging) trước khi tạo mã QR. Vui lòng thêm giai đoạn đóng gói trước.',
        error: {
          status: 400,
          stack: process.env.NODE_ENV === 'development' 
            ? 'Quy trình: production -> packaging -> QR -> distribution -> retail -> sold'
            : ''
        }
      });
    }
    
    const qrCode = await QRCode.generateQRCode(productId);
    
    res.redirect(`/qr/${productId}/view`);
  } catch (error) {
    next(error);
  }
};

exports.viewQR = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    const qrCode = await QRCode.getQRCodeByProductId(productId);
    
    if (!qrCode) {
      return res.status(404).render('error', { message: 'Chưa tạo mã QR cho sản phẩm này' });
    }
    
    res.render('qr/view', { 
      product, 
      qrCode,
      title: `Mã QR sản phẩm: ${product.name}` 
    });
  } catch (error) {
    next(error);
  }
};

exports.incrementScan = async (req, res) => {
  try {
    const qrCodeId = req.params.qrId;
    await QRCode.incrementScanCount(qrCodeId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
