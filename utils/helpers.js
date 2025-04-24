// ...existing code...

/**
 * Lấy icon tương ứng với giai đoạn sản phẩm
 * @param {string} stageName - Tên giai đoạn
 * @returns {string} - CSS class của icon
 */
function getStageIcon(stageName) {
  switch (stageName) {
    case 'production':
      return 'fas fa-cogs';
    case 'packaging':
      return 'fas fa-box';
    case 'qr_generated':
      return 'fas fa-qrcode';
    case 'distribution':
      return 'fas fa-truck';
    case 'retail':
      return 'fas fa-store';
    case 'sold':
      return 'fas fa-shopping-cart';
    case 'ownership_transfer':
      return 'fas fa-exchange-alt';
    default:
      return 'fas fa-circle';
  }
}

/**
 * Định dạng tên giai đoạn để hiển thị
 * @param {string} stageName - Tên giai đoạn
 * @returns {string} - Tên giai đoạn đã định dạng
 */
function formatStageName(stageName) {
  switch (stageName) {
    case 'production':
      return 'Sản xuất';
    case 'packaging':
      return 'Đóng gói';
    case 'qr_generated':
      return 'Tạo mã QR';
    case 'distribution':
      return 'Chuyển đến đơn vị vận chuyển';
    case 'retail':
      return 'Đến nhà bán lẻ';
    case 'sold':
      return 'Đã bán';
    case 'ownership_transfer':
      return 'Chuyển quyền sở hữu';
    case 'pickup_confirmed':
      return 'Lấy hàng thành công';
    default:
      return stageName;
  }
}

/**
 * Định dạng timestamp để hiển thị
 * @param {*} timestamp - Timestamp dưới nhiều định dạng khác nhau
 * @returns {string} - Chuỗi ngày tháng đã định dạng
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Không có thông tin';
  
  try {
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString('vi-VN');
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleString('vi-VN');
    } else {
      return new Date(timestamp).toLocaleString('vi-VN');
    }
  } catch (e) {
    return 'Không có thông tin';
  }
}

// ...existing code...

module.exports = {
  getStageIcon,
  formatStageName,
  formatTimestamp,
  // ...other existing exports...
};