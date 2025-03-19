const QRCode = require('qrcode');
const { v4: uuid } = require('uuid');
const path = require('path');
const fs = require('fs');

/**
 * Service tạo và quản lý mã QR
 * - Tạo mã QR dựa trên URL
 * - Lưu trữ và quản lý hình ảnh mã QR
 */
class QRCodeService {
  /**
   * Tạo mã QR từ URL và lưu dưới dạng file
   * @param {String} url - URL cần mã hóa thành QR
   * @returns {String} - Đường dẫn đến file hình QR
   */
  async generate(url) {
    try {
      // Tạo thư mục lưu trữ QR nếu chưa tồn tại
      const qrDir = path.join(__dirname, '../public/qrcodes');
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }
      
      // Tạo tên file duy nhất
      const fileName = `qr-${uuid()}.png`;
      const filePath = path.join(qrDir, fileName);
      const publicPath = `/qrcodes/${fileName}`;
      
      // Tạo QR code
      await QRCode.toFile(filePath, url, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      return publicPath;
    } catch (error) {
      console.error('QR Code Generation Error:', error);
      // Trong trường hợp lỗi, trả về một ảnh QR mặc định
      return '/qrcodes/default-qr.png';
    }
  }

  /**
   * Tạo QR code dưới dạng data URL
   * @param {String} url - URL cần mã hóa thành QR
   * @returns {String} - Data URL của mã QR
   */
  async generateDataUrl(url) {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 1
      });
      
      return dataUrl;
    } catch (error) {
      console.error('QR Data URL Generation Error:', error);
      return '';
    }
  }
}

module.exports = new QRCodeService();
