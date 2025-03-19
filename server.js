const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const net = require('net');

// Đảm bảo các thư mục cần thiết tồn tại
const ensureDirs = require('./utils/ensureDirs');
ensureDirs();

// Tải biến môi trường
dotenv.config();

// Xử lý ngoại lệ không được bắt
process.on('uncaughtException', (error) => {
  // Đặc biệt xử lý lỗi EADDRINUSE để thông báo rõ ràng hơn
  if (error.code === 'EADDRINUSE') {
    console.error(`\x1b[31mLỗi: Cổng ${error.port} đã được sử dụng bởi một ứng dụng khác.\x1b[0m`);
    console.log('\x1b[33mGợi ý: Hãy thử một trong các cách sau:\x1b[0m');
    console.log('  1. Đóng ứng dụng đang sử dụng cổng này');
    console.log('  2. Chỉ định một cổng khác trong file .env (ví dụ: PORT=3001)');
    console.log('  3. Chạy với cổng khác: PORT=3001 npm run dev');
    process.exit(1);
  } else {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', error);
    fs.appendFileSync('error.log', `${new Date().toISOString()} - ${error.stack}\n`);
    process.exit(1);
  }
});

// Hàm kiểm tra cổng có sẵn không
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        resolve(false);
      })
      .once('listening', () => {
        server.close();
        resolve(true);
      })
      .listen(port);
  });
}

// Hàm tìm cổng thay thế
async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortAvailable(port)) && port < startPort + 100) {
    port++;
  }
  return port;
}

// Hàm khởi động server
async function startServer() {
  try {
    // Import Express app
    const app = require('./app');
    
    // Kích hoạt giám sát hệ thống nếu cần
    require('./config/monitor')();
    
    // Xác định port
    let PORT = parseInt(process.env.PORT || '3000', 10);
    
    // Kiểm tra cổng đã được sử dụng chưa
    if (!(await isPortAvailable(PORT))) {
      console.warn(`\x1b[33mCảnh báo: Cổng ${PORT} đã được sử dụng. Đang tìm cổng thay thế...\x1b[0m`);
      PORT = await findAvailablePort(PORT + 1);
      console.log(`\x1b[32mĐã tìm thấy cổng thay thế: ${PORT}\x1b[0m`);
    }
    
    // Hiển thị thông tin môi trường
    console.log('Environment variables loaded:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('- PORT:', PORT);
    console.log('- BASE_URL:', process.env.BASE_URL || `http://localhost:${PORT}`);
    
    // Khởi động server
    const server = app.listen(PORT, () => {
      // Hiển thị thông tin rõ ràng hơn về cách truy cập
      console.log(`\x1b[32m✅ Server đã khởi động thành công!\x1b[0m`);
      console.log(`📋 Thông tin server:`);
      console.log(`   - Cổng: ${PORT}`);
      console.log(`   - Địa chỉ: http://localhost:${PORT}`);
      console.log(`   - Môi trường: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\x1b[36m💻 Mở trình duyệt và truy cập: http://localhost:${PORT}\x1b[0m`);
    });
    
    // Xử lý tín hiệu tắt server
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
      });
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
}

// Khởi động server
startServer();
