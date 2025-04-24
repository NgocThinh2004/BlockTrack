/**
 * Chuyển đổi tên giai đoạn kỹ thuật thành tên hiển thị thân thiện
 * @param {string} stageName - Tên giai đoạn kỹ thuật
 * @returns {string} - Tên hiển thị
 */
function getStageName(stageName) {
  switch(stageName) {
    case 'production':
      return 'Sản xuất';
    case 'packaging':
      return 'Đóng gói';
    case 'qr_generated':
      return 'Tạo mã QR';
    case 'distribution':
      return 'Chuyển đến đơn vị vận chuyển';
    case 'pickup_confirmed':
      return 'Lấy hàng thành công';
    case 'retail':
      return 'Đã đến nhà bán lẻ';
    case 'sold':
      return 'Đã bán';
    case 'ownership_transfer':
      return 'Chuyển quyền sở hữu';
    default:
      return stageName;
  }
}

module.exports = {
  getStageName
};
