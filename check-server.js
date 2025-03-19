const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 3000;
const options = {
  hostname: 'localhost',
  port: port,
  path: '/',
  method: 'GET'
};

console.log(`🔍 Kiểm tra kết nối đến http://localhost:${port}...`);

const req = http.request(options, (res) => {
  console.log(`📡 Trạng thái kết nối: ${res.statusCode}`);
  console.log(`📝 Headers: ${JSON.stringify(res.headers)}`);

  res.on('data', (chunk) => {
    console.log(`📄 Nhận được dữ liệu: ${chunk.length} bytes`);
  });

  res.on('end', () => {
    console.log('✅ Kết nối thành công! Server đang hoạt động.');
  });
});

req.on('error', (error) => {
  console.error('❌ Lỗi kết nối:', error.message);
  console.log('💡 Kiểm tra xem:');
  console.log('   1. Server đã được khởi động chưa');
  console.log(`   2. Server có đang chạy trên cổng ${port} không`);
  console.log('   3. Có firewall nào đang chặn kết nối không');
});

req.end();
