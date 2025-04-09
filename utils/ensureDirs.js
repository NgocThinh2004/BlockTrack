const fs = require('fs');
const path = require('path');

/**
 * Đảm bảo các thư mục cần thiết đã được tạo
 */
function ensureDirs() {
  const dirs = [
    path.join(__dirname, '../sessions'),
    path.join(__dirname, '../public/qrcodes'),
    path.join(__dirname, '../public/images'),
    path.join(__dirname, '../temp')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

module.exports = ensureDirs;
