const Product = require('../models/productModel');
const QRCode = require('../models/qrCodeModel');

/**
 * Controller đơn giản cho trang truy xuất
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

exports.trackProduct = async (req, res) => {
  const productId = req.params.id;
  
  // Dữ liệu mẫu
  const mockProduct = {
    id: productId,
    name: "Sản phẩm mẫu " + productId,
    manufacturer: "Nhà sản xuất mẫu",
    origin: "Việt Nam",
    productionDate: new Date(),
    currentStage: "production",
    blockchainId: "0x123456789",
    description: "Mô tả sản phẩm mẫu"
  };
  
  const mockHistory = [
    {
      stageName: "production",
      description: "Sản phẩm được sản xuất",
      location: "Nhà máy A",
      timestamp: new Date()
    }
  ];
  
  res.render('track/product', {
    product: mockProduct,
    history: mockHistory,
    qrCode: null,
    title: `Truy xuất: ${mockProduct.name}`
  });
};
