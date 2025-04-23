const Product = require('../models/productModel');
const QRCode = require('../models/qrCodeModel');
const ProductStage = require('../models/stageModel');
const { getProductChanges } = require('../utils/productDiff');
const helpers = require('../utils/helpers');

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
    
    // Lấy chi tiết thay đổi sản phẩm
    // Sửa: Đảm bảo hàm getProductChanges được gọi đúng cách và thêm log để debug
    console.log('Trạng thái xác thực sản phẩm:', {
      id: product.id,
      verified: product.verified,
      hasOriginalHash: !!product.originalHash,
      hasCurrentHash: !!product.currentHash
    });
    
    let productChanges = null;
    if (product.verified === false) {
      // Đảm bảo xử lý hàm async đúng cách
      productChanges = await getProductChanges(product);
      console.log('Chi tiết thay đổi sản phẩm:', { hasChanges: !!productChanges, changesCount: productChanges ? productChanges.length : 0 });
    }
    
    res.render('track/product', {
      product,
      history: history || [],
      qrCode,
      productChanges,
      title: `Truy xuất: ${product.name}`
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    
    // Lấy thông tin sản phẩm từ database
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.render('track/index', {
        error: 'Không tìm thấy sản phẩm với ID đã nhập',
        title: 'Truy xuất sản phẩm'
      });
    }
    
    // Lấy lịch sử các giai đoạn
    const history = await ProductStage.getStagesByProductId(productId);
    
    // Lấy QR code nếu có
    const qrCode = await QRCode.getQRCodeByProductId(productId);
    
    // Helper functions cho template
    const stageHelpers = {
      getStageIcon: function(stageName) {
        switch (stageName) {
          case 'production':
            return 'fas fa-cogs';
          case 'packaging':
            return 'fas fa-box';
          case 'qr_generated':
            return 'fas fa-qrcode';
          case 'distribution':
            return 'fas fa-truck';
          case 'retail':
            return 'fas fa-store';
          case 'sold':
            return 'fas fa-shopping-cart';
          case 'ownership_transfer':
            return 'fas fa-exchange-alt';
          default:
            return 'fas fa-circle';
        }
      },
      
      formatStageName: function(stageName) {
        switch (stageName) {
          case 'production':
            return 'Sản xuất';
          case 'packaging':
            return 'Đóng gói';
          case 'qr_generated':
            return 'Tạo mã QR';
          case 'distribution':
            return 'Chuyển đến đơn vị vận chuyển';
          case 'retail':
            return 'Đến nhà bán lẻ';
          case 'sold':
            return 'Đã bán';
          case 'ownership_transfer':
            return 'Chuyển quyền sở hữu';
          default:
            return stageName;
        }
      },
      
      formatTimestamp: function(timestamp) {
        if (!timestamp) return 'Không có thông tin';
        
        try {
          if (typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleString('vi-VN');
          } else if (timestamp instanceof Date) {
            return timestamp.toLocaleString('vi-VN');
          } else {
            return new Date(timestamp).toLocaleString('vi-VN');
          }
        } catch (e) {
          return 'Không có thông tin';
        }
      }
    };
    
    res.render('track/product', {
      product,
      history: history || [],
      qrCode,
      productChanges: null,
      title: `Truy xuất: ${product.name}`,
      // Truyền các helpers vào template
      getStageIcon: stageHelpers.getStageIcon,
      formatStageName: stageHelpers.formatStageName,
      formatTimestamp: stageHelpers.formatTimestamp
    });
  } catch (error) {
    next(error);
  }
};
