const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Đảm bảo thư mục tồn tại
const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`Đã tạo thư mục: ${imagesDir}`);
}

// Thiết lập các nền với phối màu chuyên nghiệp
const backgrounds = [
  {
    filename: 'background1.jpg',
    gradient: {
      start: '#1a237e', // Deep blue
      end: '#4a148c'    // Deep purple
    },
    title: 'Blockchain Security'
  },
  {
    filename: 'background2.jpg',
    gradient: {
      start: '#004d40', // Deep teal
      end: '#006064'    // Deep cyan
    },
    title: 'Supply Chain Tracking'
  },
  {
    filename: 'background3.jpg',
    gradient: {
      start: '#0d47a1', // Deep blue
      end: '#01579b'    // Deep light blue
    },
    title: 'Transparent Production'
  }
];

// Kích thước: 1280x720px
const width = 1280;
const height = 720;

console.log('Creating actual JPG images instead of SVG with .jpg extension');
console.log('To use this script, first install the canvas package:');
console.log('npm install canvas');
console.log('\nNote: This requires external dependencies. If installation fails:');
console.log('1. Try using actual JPG/PNG files directly');
console.log('2. Or rename SVG files to have .svg extension');
console.log('3. Or modify your view to use proper content-type');

// Với node-canvas, bạn có thể tạo JPG thực sự
try {
  backgrounds.forEach(bg => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, bg.gradient.start);
    gradient.addColorStop(1, bg.gradient.end);
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    
    // Draw grid
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(bg.title, 80, 80);
    
    ctx.font = '18px Arial';
    ctx.fillText('Truy xuất nguồn gốc sản phẩm', 80, 115);
    
    // Save as JPEG
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(imagesDir, bg.filename), buffer);
    console.log(`Created background: ${bg.filename}`);
  });
} catch (error) {
  console.error('Error creating JPG images:', error.message);
  console.log('\nFallback solution:');
  console.log('1. Rename your SVG files to have .svg extension');
  console.log('2. Update your HTML to reference .svg files instead of .jpg');
}
