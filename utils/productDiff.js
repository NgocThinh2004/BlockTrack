const blockchainService = require('../services/blockchainService');

/**
 * So sánh sản phẩm hiện tại với phiên bản gốc
 * @param {Object} product - Sản phẩm hiện tại với các thuộc tính originalHash và currentHash
 * @returns {Object} - Danh sách các trường đã thay đổi
 */
async function getProductChanges(product) {
  // Nếu sản phẩm không có dữ liệu hash hoặc đã được xác thực
  if (!product || product.verified !== false) {
    console.log("Không hiển thị thay đổi - sản phẩm đã được xác thực hoặc null");
    return null;
  }
  
  if (!product.originalHash || !product.currentHash) {
    console.log("Không hiển thị thay đổi - thiếu originalHash hoặc currentHash");
    return null;
  }

  // Các trường tiềm năng đã được thay đổi
  const changes = [];

  // Danh sách các trường quan trọng cần kiểm tra
  const importantFields = [
    { field: 'name', label: 'Tên sản phẩm', originalValue: 'Chưa xác định' },
    { field: 'manufacturer', label: 'Nhà sản xuất', originalValue: 'Chưa xác định' },
    { field: 'origin', label: 'Xuất xứ', originalValue: 'Chưa xác định' },
    { field: 'description', label: 'Mô tả', originalValue: 'Chưa xác định' },
    { field: 'batchNumber', label: 'Số lô', originalValue: 'Chưa xác định' },
    { field: 'productionDate', label: 'Ngày sản xuất', originalValue: 'Chưa xác định' },
    { field: 'expiryDate', label: 'Hạn sử dụng', originalValue: 'Chưa xác định' }
  ];

  console.log("Kiểm tra dữ liệu sản phẩm:", {
    id: product.id,
    hasOriginalValues: !!product.originalValues,
    blockchainId: product.blockchainId,
    hashMatch: product.originalHash === product.currentHash,
    verified: product.verified
  });

  // Chỉ sử dụng dữ liệu gốc từ product.originalValues
  let originalData = null;
  if (product.originalValues && Object.keys(product.originalValues).length > 0) {
    originalData = product.originalValues;
    console.log('Sử dụng dữ liệu gốc khi tạo sản phẩm:', originalData);
  } else {
    console.log('Không tìm thấy dữ liệu gốc khi tạo sản phẩm');
    // Trả về null nếu không có dữ liệu gốc
    return null;
  }

  // Xử lý từng trường thông tin
  importantFields.forEach(({ field, label }) => {
    const originalValue = formatValue(originalData[field]);
    const currentValue = formatValue(product[field]);
    
    // Kiểm tra xem giá trị có thay đổi không
    const changed = originalValue !== currentValue;

    // Thêm vào danh sách các thay đổi
    changes.push({
      fieldName: label,
      originalValue: originalValue,
      currentValue: currentValue,
      changed: changed
    });
  });

  return changes;
}

/**
 * Định dạng giá trị để hiển thị
 * @param {*} value - Giá trị cần định dạng
 * @returns {string} - Giá trị đã định dạng
 */
function formatValue(value) {
  if (value === undefined || value === null) {
    return "N/A";
  }

  // Định dạng Date
  if (value instanceof Date) {
    return value.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
  }

  // Định dạng Firebase timestamp
  if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
    return value.toDate().toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
  }

  return String(value);
}

module.exports = {
  getProductChanges
};
