# BlockTrack - Hệ thống truy xuất nguồn gốc sản phẩm sử dụng Blockchain

Hệ thống truy xuất nguồn gốc sản phẩm giúp minh bạch hóa thông tin sản phẩm từ nhà sản xuất đến người tiêu dùng, sử dụng công nghệ blockchain để đảm bảo tính toàn vẹn dữ liệu.

## Tính năng

- Đăng ký và quản lý 3 vai trò: Nhà sản xuất, Nhà phân phối và Nhà bán lẻ
- Tạo và quản lý thông tin sản phẩm trên blockchain
- Theo dõi hành trình sản phẩm qua các giai đoạn: Sản xuất, Đóng gói, Vận chuyển, Bán lẻ
- Tạo và quét mã QR để truy xuất thông tin sản phẩm
- Dashboard theo vai trò người dùng
- Xác thực người dùng và tích hợp với ví MetaMask

## Công nghệ sử dụng

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Bootstrap 5, Font Awesome
- **Database**: Firebase Firestore
- **Blockchain**: Web3.js, Ethereum Smart Contracts
- **Xác thực**: Express-session, bcrypt
- **Khác**: QRCode

## Cài đặt

### Yêu cầu

- Node.js (v14+)
- MongoDB
- Tài khoản Firebase
- Metamask
- Ganache (local blockchain) hoặc kết nối đến mạng Ethereum testnet

### Các bước cài đặt

1. Clone dự án:

```bash
git clone https://github.com/yourusername/blocktrack.git
cd blocktrack
```

2. Cài đặt các phụ thuộc:

```bash
npm install
```

3. Cấu hình biến môi trường:

   Tạo file `.env` với nội dung như sau:

