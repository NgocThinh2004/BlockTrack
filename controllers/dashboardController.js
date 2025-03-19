const Product = require('../models/productModel');
const User = require('../models/userModel');

/**
 * Controller xử lý hiển thị dashboard cho từng vai trò
 * - Dashboard nhà sản xuất
 * - Dashboard nhà phân phối
 * - Dashboard nhà bán lẻ
 */
exports.getProducerDashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = await User.getUserById(userId);
    
    if (!user || user.role !== 'producer') {
      return res.status(403).redirect('/auth/login');
    }
    
    const products = await Product.getProductsByManufacturer(userId);
    
    // Thống kê sản phẩm theo giai đoạn
    const productsByStage = {
      production: products.filter(p => p.currentStage === 'production').length,
      packaging: products.filter(p => p.currentStage === 'packaging').length,
      distribution: products.filter(p => p.currentStage === 'distribution').length,
      retail: products.filter(p => p.currentStage === 'retail').length,
      sold: products.filter(p => p.currentStage === 'sold').length
    };
    
    res.render('dashboard/producer', { 
      user,
      products,
      productsByStage,
      productsCount: products.length,
      title: 'Dashboard nhà sản xuất'
    });
  } catch (error) {
    next(error);
  }
};

exports.getDistributorDashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = await User.getUserById(userId);
    
    if (!user || user.role !== 'distributor') {
      return res.status(403).redirect('/auth/login');
    }
    
    const products = await Product.getProductsByManufacturer(userId);
    
    // Thống kê sản phẩm theo giai đoạn
    const productsByStage = {
      received: products.filter(p => p.currentStage === 'distribution').length,
      inTransit: products.filter(p => p.currentStage === 'in_transit').length,
      delivered: products.filter(p => p.currentStage === 'retail').length
    };
    
    res.render('dashboard/distributor', { 
      user,
      products,
      productsByStage,
      productsCount: products.length,
      title: 'Dashboard nhà phân phối'
    });
  } catch (error) {
    next(error);
  }
};

exports.getRetailerDashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = await User.getUserById(userId);
    
    if (!user || user.role !== 'retailer') {
      return res.status(403).redirect('/auth/login');
    }
    
    const products = await Product.getProductsByManufacturer(userId);
    
    // Thống kê sản phẩm theo giai đoạn
    const productsByStage = {
      inStock: products.filter(p => p.currentStage === 'retail').length,
      sold: products.filter(p => p.currentStage === 'sold').length
    };
    
    res.render('dashboard/retailer', { 
      user,
      products,
      productsByStage,
      productsCount: products.length,
      title: 'Dashboard nhà bán lẻ'
    });
  } catch (error) {
    next(error);
  }
};

exports.getConsumerDashboard = async (req, res) => {
  res.redirect('/');
};
