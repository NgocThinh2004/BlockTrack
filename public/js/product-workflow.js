/**
 * Script xử lý luồng quy trình sản phẩm và thông báo
 */
document.addEventListener('DOMContentLoaded', function() {
  // Xử lý nút tạo mã QR
  const qrButtons = document.querySelectorAll('.qr-create-btn');
  
  qrButtons.forEach(button => {
    if (button.classList.contains('disabled')) {
      // Thêm tooltip bootstrap nếu có
      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        new bootstrap.Tooltip(button);
      }
      
      // Thêm sự kiện click để hiển thị thông báo
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Kiểm tra nếu sản phẩm chưa được đóng gói
        if (button.dataset.needsPackaging === 'true') {
          // Tạo modal thông báo
          showWorkflowAlert(
            'Cần đóng gói trước',
            'Sản phẩm phải được đóng gói trước khi tạo mã QR. Vui lòng thêm giai đoạn đóng gói trước.',
            'warning'
          );
        } else {
          // Trường hợp khác
          showWorkflowAlert(
            'Không thể tạo mã QR',
            'Không thể tạo mã QR cho sản phẩm này. Vui lòng kiểm tra quyền và trạng thái sản phẩm.',
            'info'
          );
        }
      });
    }
  });
  
  // Hiển thị thông báo dạng modal hoặc toast
  function showWorkflowAlert(title, message, type = 'warning') {
    // Kiểm tra nếu đã có SweetAlert2
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'Đã hiểu'
      });
    } 
    // Sử dụng alert thông thường nếu không có thư viện
    else {
      alert(`${title}\n\n${message}`);
    }
  }
});

/**
 * Script xử lý luồng quy trình sản phẩm và thông báo
 */
document.addEventListener('DOMContentLoaded', function() {
  // Xử lý nút tạo mã QR bị vô hiệu hóa
  const disabledQrButtons = document.querySelectorAll('.qr-create-btn.disabled');
  
  disabledQrButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Kiểm tra nếu sản phẩm chưa được đóng gói
      if (this.getAttribute('data-needs-packaging') === 'true') {
        alert('Sản phẩm phải được đóng gói trước khi tạo mã QR. Vui lòng thêm giai đoạn đóng gói trước.');
      } else {
        alert('Không thể tạo mã QR cho sản phẩm này.');
      }
      
      return false;
    });
  });
  
  // Khởi tạo tooltips nếu Bootstrap đã được tải
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
  }
});
