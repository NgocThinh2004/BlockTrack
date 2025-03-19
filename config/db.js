const mongoose = require('mongoose');

/**
 * Kết nối MongoDB
 * - Sử dụng URI từ biến môi trường
 * - Cấu hình các tùy chọn kết nối
 */
const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // IPv4
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`MongoDB kết nối thành công: ${conn.connection.host}`);
    
    // Xử lý các sự kiện kết nối
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected! Attempting to reconnect...');
    });
    
    // Thử kết nối lại khi mất kết nối
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected! Attempting to reconnect...');
      setTimeout(() => {
        connectDB();
      }, 5000);
    });
    
  } catch (error) {
    console.error(`Lỗi kết nối MongoDB: ${error.message}`);
    // Thử kết nối lại sau 5 giây
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
