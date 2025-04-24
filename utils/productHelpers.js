/**
 * Định dạng tên giai đoạn để hiển thị
 * @param {string} stageName - Tên giai đoạn
 * @returns {string} - Tên giai đoạn đã định dạng
 */
function getStageName(stageName) {
  switch(stageName) {
    case 'production': return 'Sản xuất';
    case 'packaging': return 'Đóng gói';
    case 'qr_generated': return 'Tạo mã QR';
    case 'distribution': return 'Chuyển đến đơn vị vận chuyển';
    case 'pickup_confirmed': return 'Lấy hàng thành công';
    case 'retail': return 'Đã đến nhà bán lẻ';
    case 'sold': return 'Đã bán';
    case 'ownership_transfer': return 'Chuyển quyền sở hữu';
    default: return stageName;
  }
}

module.exports = {
  getStageName
};
