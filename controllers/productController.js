const Product = require('../models/productModel');
const QRCode = require('../models/qrCodeModel');

/**
 * Controller đơn giản cho trang sản phẩm
 */
exports.getAllProducts = (req, res) => {
  // Dữ liệu mẫu
  const products = [
    {
      id: "product-1",
      name: "Sản phẩm mẫu 1",
      manufacturer: "Công ty ABC",
      origin: "Việt Nam",
      productionDate: new Date(),
      currentStage: "production",
      createdAt: new Date(),
      description: "Mô tả sản phẩm mẫu 1"
    },
    {
      id: "product-2",
      name: "Sản phẩm mẫu 2",
      manufacturer: "Công ty XYZ",
      origin: "Việt Nam",
      productionDate: new Date(),
      currentStage: "retail",
      createdAt: new Date(),
      description: "Mô tả sản phẩm mẫu 2"
    }
  ];
  
  res.render('products/index', { 
    title: 'Danh sách sản phẩm',
    products
  });
};

exports.getProduct = (req, res) => {
  const productId = req.params.id;
  
  // Dữ liệu mẫu
  const product = {
    id: productId,
    name: "Sản phẩm " + productId,
    manufacturer: "Công ty ABC",
    origin: "Việt Nam",
    productionDate: new Date(),
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    currentStage: "production",
    blockchainId: "0x123456789",
    createdAt: new Date(),
    ownerId: req.session.userId || '',
    description: "Mô tả sản phẩm chi tiết"
  };
  
  const history = [
    {
      stageName: "production",
      description: "Sản phẩm được sản xuất",
      location: "Nhà máy A",
      timestamp: new Date()
    }
  ];
  
  res.render('products/show', {
    title: product.name,
    product,
    history,
    qrCode: null
  });
};

// Các phương thức khác đơn giản hóa
exports.showCreateForm = (req, res) => {
  res.render('products/create', { title: 'Tạo sản phẩm mới' });
};

exports.createProduct = (req, res) => {
  res.redirect('/products/product-new');
};

exports.showEditForm = (req, res) => {
  const productId = req.params.id;
  
  // Dữ liệu mẫu
  const product = {
    id: productId,
    name: "Sản phẩm " + productId,
    manufacturer: "Công ty ABC",
    origin: "Việt Nam",
    productionDate: new Date(),
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    currentStage: "production",
    blockchainId: "0x123456789",
    createdAt: new Date(),
    ownerId: req.session.userId || '',
    description: "Mô tả sản phẩm chi tiết"
  };
  
  res.render('products/edit', { 
    title: 'Chỉnh sửa: ' + product.name,
    product 
  });
};

exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  res.redirect(`/products/${productId}`);
};
