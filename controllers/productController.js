const Product = require('../models/productModel');
const QRCode = require('../models/qrCodeModel');
const ProductStage = require('../models/stageModel');

/**
 * Controller xử lý sản phẩm
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    // Lấy tham số tìm kiếm và lọc từ query
    const search = req.query.search || '';
    const stage = req.query.stage || '';
    const sort = req.query.sort || 'createdAt';

    let products = [];
    
    // Nếu có tìm kiếm
    if (search) {
      products = await Product.searchProducts(search);
    } else {
      // Lấy tất cả sản phẩm
      products = await Product.getAllProducts();
    }

    // Lọc theo giai đoạn nếu có
    if (stage) {
      products = products.filter(p => p.currentStage === stage);
    }

    // Sắp xếp kết quả
    products.sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sort === 'manufacturer') {
        return a.manufacturer.localeCompare(b.manufacturer);
      } else {
        // Mặc định sắp xếp theo createdAt - mới nhất trước
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    res.render('products/index', { 
      title: 'Danh sách sản phẩm',
      products,
      currentSearch: search,
      currentStage: stage,
      currentSort: sort
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    
    // Lấy thông tin sản phẩm từ database
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    // Lấy lịch sử các giai đoạn của sản phẩm
    const stages = await ProductStage.getStagesByProductId(productId);
    
    // Lấy mã QR nếu có
    const qrCode = await QRCode.getQRCodeByProductId(productId);
    
    res.render('products/show', {
      title: product.name,
      product,
      history: stages || [],
      qrCode
    });
  } catch (error) {
    next(error);
  }
};

// Các phương thức khác đơn giản hóa
exports.showCreateForm = (req, res) => {
  res.render('products/create', { title: 'Tạo sản phẩm mới' });
};

exports.createProduct = async (req, res) => {
  try {
    // Lấy dữ liệu từ form
    const productData = {
      name: req.body.name,
      manufacturer: req.body.manufacturer,
      origin: req.body.origin,
      description: req.body.description,
      batchNumber: req.body.batchNumber,
      productionDate: req.body.productionDate,
      expiryDate: req.body.expiryDate,
      ownerId: req.user.id // Lấy từ req.user nhờ middleware loadUser
    };
    
    // Kiểm tra dữ liệu
    if (!productData.name || !productData.manufacturer || !productData.origin || !productData.productionDate) {
      return res.render('products/create', { 
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        formData: productData,
        title: 'Tạo sản phẩm mới'
      });
    }
    
    // Tạo sản phẩm và lưu vào database + blockchain
    const product = await Product.createProduct(productData);
    
    // Chuyển hướng đến trang chi tiết sản phẩm
    res.redirect(`/products/${product.id}`);
  } catch (error) {
    console.error('Error creating product:', error);
    res.render('products/create', {
      error: 'Có lỗi xảy ra khi tạo sản phẩm. Vui lòng thử lại.',
      formData: req.body,
      title: 'Tạo sản phẩm mới'
    });
  }
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

exports.editProductPage = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    // Kiểm tra quyền sở hữu
    if (product.ownerId !== req.session.userId) {
      return res.status(403).render('error', { 
        message: 'Bạn không có quyền chỉnh sửa sản phẩm này' 
      });
    }
    
    // Kiểm tra trạng thái blockchain - không cho phép chỉnh sửa nếu đã có trên blockchain
    if (product.blockchainId && product.blockchainId !== 'Đang xử lý') {
      return res.status(403).render('error', { 
        message: 'Không thể chỉnh sửa sản phẩm đã được xác thực trên blockchain',
        error: {
          status: 403,
          stack: 'Sản phẩm đã được lưu trên blockchain không thể sửa đổi để đảm bảo tính toàn vẹn dữ liệu.'
        }
      });
    }
    
    res.render('products/edit', { product, title: `Chỉnh sửa ${product.name}` });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.getProductById(productId);
    
    // Kiểm tra sản phẩm tồn tại
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    // Kiểm tra quyền sở hữu
    if (product.ownerId !== req.session.userId) {
      return res.status(403).render('error', { 
        message: 'Bạn không có quyền chỉnh sửa sản phẩm này' 
      });
    }
    
    // Kiểm tra trạng thái blockchain - không cho phép chỉnh sửa nếu đã có trên blockchain
    if (product.blockchainId && product.blockchainId !== 'Đang xử lý') {
      return res.status(403).render('error', { 
        message: 'Không thể chỉnh sửa sản phẩm đã được xác thực trên blockchain' 
      });
    }
    
    // Nếu tất cả kiểm tra OK, tiếp tục với việc cập nhật
    // ...existing code for updating product...
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  res.redirect(`/products/${productId}`);
};

/**
 * Thử lại gửi sản phẩm lên blockchain khi lần đầu gặp lỗi
 */
exports.retryBlockchain = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.getProductById(productId);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    }
    
    // Kiểm tra quyền sở hữu
    if (product.ownerId !== req.session.userId) {
      return res.status(403).render('error', { 
        message: 'Bạn không có quyền thực hiện thao tác này' 
      });
    }
    
    // Chỉ cho phép thử lại nếu sản phẩm đang trong trạng thái "Đang xử lý" hoặc có lỗi blockchain
    if (product.blockchainId && product.blockchainId !== 'Đang xử lý') {
      return res.status(400).render('error', { 
        message: 'Sản phẩm này đã được xác thực trên blockchain' 
      });
    }
    
    // Thử lại đưa lên blockchain
    const result = await Product.retryBlockchain(productId);
    
    if (result.success) {
      req.flash('success', 'Sản phẩm đã được xác thực thành công trên blockchain');
    } else {
      req.flash('error', `Không thể xác thực sản phẩm: ${result.error}`);
    }
    
    res.redirect(`/products/${productId}`);
  } catch (error) {
    next(error);
  }
};
