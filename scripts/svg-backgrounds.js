const fs = require('fs');
const path = require('path');

// Đảm bảo thư mục tồn tại
const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`Đã tạo thư mục: ${imagesDir}`);
}

// Xóa các file background1.jpg, background2.jpg, background3.jpg nếu tồn tại
['background1.jpg', 'background2.jpg', 'background3.jpg'].forEach(file => {
  const filePath = path.join(imagesDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Đã xóa file cũ: ${file}`);
  }
});

console.log('Đã xóa các file hình nền cũ nếu có');
console.log('Bạn không cần các file hình nền riêng biệt nữa!');
console.log('Chúng tôi sẽ sử dụng SVG nội tuyến trực tiếp trong template.');
