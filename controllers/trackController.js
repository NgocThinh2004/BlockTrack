const Product = require('../models/productModel');
const QRCode = require('../models/qrCodeModel');
const ProductStage = require('../models/stageModel');
const { getProductChanges } = require('../utils/productDiff');
const helpers = require('../utils/helpers');
const { getStageName } = require('../utils/productHelpers');

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
          case 'pickup_confirmed':
            return 'fas fa-check-circle';
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
          case 'pickup_confirmed':
            return 'Lấy hàng thành công';
          case 'retail':
            return 'Đã đến nhà bán lẻ';
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

exports.getProductById = async (req, res, next) => {
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
    
    // Sử dụng hàm getStageName từ utils
    const helpers = {
      formatCurrency: function(amount) {
        // ...existing code...
      },
      
      getStageName: function(stageName) {
        return getStageName(stageName);
      },
      
      formatTimestamp: function(timestamp) {
        // ...existing code...
      }
    };
    
    res.render('track/product', {
      product,
      history: history || [],
      qrCode,
      productChanges: null,
      helpers,
      title: `Truy xuất: ${product.name}`
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductByToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    
    // Lấy thông tin sản phẩm từ database
    const product = await Product.getProductByToken(token);
    
    if (!product) {
      return res.render('track/index', {
        error: 'Không tìm thấy sản phẩm với mã QR đã nhập',
        title: 'Truy xuất sản phẩm'
      });
    }
    
    // Lấy lịch sử các giai đoạn
    const history = await ProductStage.getStagesByProductId(product.id);
    
    // Lấy QR code nếu có
    const qrCode = await QRCode.getQRCodeByProductId(product.id);
    
    // Kiểm tra xem sản phẩm có bị sửa đổi không
    let productChanges = null;
    if (product.verified === false) {
      // Đảm bảo xử lý hàm async đúng cách
      productChanges = await getProductChanges(product);
      console.log('Chi tiết thay đổi sản phẩm:', { hasChanges: !!productChanges, changesCount: productChanges ? productChanges.length : 0 });
    }
    
    // Helper functions cho template - đổi tên từ stageHelpers thành helpers để template sử dụng đúng
    const helpers = {
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
          case 'pickup_confirmed':
            return 'fas fa-check-circle';
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
      
      getStageName: function(stageName) {
        switch (stageName) {
          case 'production':
            return 'Sản xuất';
          case 'packaging':
            return 'Đóng gói';
          case 'qr_generated':
            return 'Tạo mã QR';
          case 'distribution':
            return 'Chuyển đến đơn vị vận chuyển';
          case 'pickup_confirmed':
            return 'Lấy hàng thành công';
          case 'retail':
            return 'Đã đến nhà bán lẻ';
          case 'sold':
            return 'Đã bán';
          case 'ownership_transfer':
            return 'Chuyển quyền sở hữu';
          default:
            return stageName;
        }
      },
      
      formatTimestamp: function(timestamp) {
        if (!timestamp) return 'N/A';
        
        // Convert to Date object if needed
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        
        // Format date/time as locale string
        return date.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    };
    
    // Đảm bảo gửi helpers vào template
    res.render('track/product', {
      product,
      history: history || [],
      qrCode,
      productChanges,
      helpers, // Quan trọng: phải có helpers ở đây
      title: `Truy xuất: ${product.name}`
    });
  } catch (error) {
    next(error);
  }
};
