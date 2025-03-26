const fs = require('fs');
const path = require('path');

// Đảm bảo thư mục tồn tại
const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`Đã tạo thư mục: ${imagesDir}`);
}

// Thiết lập các phối màu chuyên nghiệp hơn
const backgrounds = [
  {
    filename: 'background1.jpg',
    gradient: {
      start: '#1a237e', // Deep blue
      end: '#4a148c'    // Deep purple
    },
    accentColor: '#03a9f4',
    title: 'Blockchain Security'
  },
  {
    filename: 'background2.jpg',
    gradient: {
      start: '#004d40', // Deep teal
      end: '#006064'    // Deep cyan
    },
    accentColor: '#26a69a',
    title: 'Supply Chain Tracking'
  },
  {
    filename: 'background3.jpg',
    gradient: {
      start: '#0d47a1', // Deep blue
      end: '#01579b'    // Deep light blue
    },
    accentColor: '#29b6f6',
    title: 'Transparent Production'
  }
];

// Kích thước: 1280x720px cho hiệu suất tốt
const width = 1280;
const height = 720;

backgrounds.forEach(bg => {
  // SVG cho background với thiết kế chuyên nghiệp hơn
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Gradients và patterns -->
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bg.gradient.start};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${bg.gradient.end};stop-opacity:1" />
      </linearGradient>
      
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      </pattern>
      
      <linearGradient id="blockchainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${bg.accentColor};stop-opacity:0.7" />
        <stop offset="100%" style="stop-color:${bg.accentColor};stop-opacity:0.3" />
      </linearGradient>
      
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    <!-- Nền với gradient -->
    <rect width="100%" height="100%" fill="url(#bgGradient)" />
    
    <!-- Overlay lưới -->
    <rect width="100%" height="100%" fill="url(#grid)"/>
    
    <!-- Hiệu ứng sáng ở góc -->
    <circle cx="0" cy="0" r="300" fill="url(#blockchainGradient)" opacity="0.1" />
    <circle cx="${width}" cy="${height}" r="250" fill="url(#blockchainGradient)" opacity="0.1" />
    
    <!-- Mạng lưới blockchain -->
    <g opacity="0.15">
      <!-- Nodes / blocks -->
      <circle cx="200" cy="180" r="5" fill="white" />
      <circle cx="350" cy="120" r="5" fill="white" />
      <circle cx="450" cy="250" r="5" fill="white" />
      <circle cx="600" cy="150" r="5" fill="white" />
      <circle cx="750" cy="220" r="5" fill="white" />
      <circle cx="900" cy="170" r="5" fill="white" />
      <circle cx="1050" cy="300" r="5" fill="white" />
      <circle cx="300" cy="350" r="5" fill="white" />
      <circle cx="500" cy="400" r="5" fill="white" />
      <circle cx="700" cy="380" r="5" fill="white" />
      <circle cx="900" cy="450" r="5" fill="white" />
      <circle cx="400" cy="550" r="5" fill="white" />
      <circle cx="600" cy="500" r="5" fill="white" />
      <circle cx="800" cy="600" r="5" fill="white" />
      
      <!-- Connections -->
      <line x1="200" y1="180" x2="350" y2="120" stroke="white" stroke-width="1" />
      <line x1="350" y1="120" x2="450" y2="250" stroke="white" stroke-width="1" />
      <line x1="450" y1="250" x2="600" y2="150" stroke="white" stroke-width="1" />
      <line x1="600" y1="150" x2="750" y2="220" stroke="white" stroke-width="1" />
      <line x1="750" y1="220" x2="900" y2="170" stroke="white" stroke-width="1" />
      <line x1="900" y1="170" x2="1050" y2="300" stroke="white" stroke-width="1" />
      <line x1="300" y1="350" x2="450" y2="250" stroke="white" stroke-width="1" />
      <line x1="300" y1="350" x2="500" y2="400" stroke="white" stroke-width="1" />
      <line x1="500" y1="400" x2="700" y2="380" stroke="white" stroke-width="1" />
      <line x1="700" y1="380" x2="900" y2="450" stroke="white" stroke-width="1" />
      <line x1="400" y1="550" x2="500" y2="400" stroke="white" stroke-width="1" />
      <line x1="400" y1="550" x2="600" y2="500" stroke="white" stroke-width="1" />
      <line x1="600" y1="500" x2="800" y2="600" stroke="white" stroke-width="1" />
    </g>
    
    <!-- Biểu tượng blockchain -->
    <g transform="translate(80, 530)">
      <!-- Biểu tượng chuỗi khối -->
      <g filter="url(#glow)">
        <rect x="0" y="0" width="50" height="50" rx="8" fill="${bg.accentColor}" opacity="0.9" />
        <rect x="70" y="0" width="50" height="50" rx="8" fill="${bg.accentColor}" opacity="0.9" />
        <rect x="140" y="0" width="50" height="50" rx="8" fill="${bg.accentColor}" opacity="0.9" />
        <line x1="50" y1="25" x2="70" y2="25" stroke="white" stroke-width="3" />
        <line x1="120" y1="25" x2="140" y2="25" stroke="white" stroke-width="3" />
      </g>
    </g>
    
    <!-- Tiêu đề trang -->
    <text x="80" y="80" font-family="Arial" font-size="32" font-weight="bold" fill="white" 
          style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">${bg.title}</text>
    
    <!-- Tagline -->
    <text x="80" y="115" font-family="Arial" font-size="18" fill="white" opacity="0.8" 
          style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));">Truy xuất nguồn gốc sản phẩm</text>
  </svg>`;
  
  fs.writeFileSync(path.join(imagesDir, bg.filename), svgContent);
  console.log(`Đã tạo background đẹp cho: ${bg.filename}`);
});

console.log('Đã tạo tất cả các tệp background!');
console.log('Trong môi trường production, bạn có thể sử dụng các ảnh này hoặc thay thế bằng ảnh JPEG/PNG thực.');
