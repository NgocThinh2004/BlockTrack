/**
 * Debug script để kiểm tra và xử lý các vấn đề liên quan đến mã QR
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('QR Debug script loaded');
  
  // Bắt sự kiện khi nút tạo QR được nhấn
  const qrBtn = document.getElementById('generateQrBtn');
  if (qrBtn) {
    console.log('QR generate button found');
    
    qrBtn.addEventListener('click', function() {
      console.log('QR generate button clicked');
      console.log('Request URL:', this.href);
    });
  }
});
