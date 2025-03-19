/**
 * Main JavaScript for Blockchain Product Tracking
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
  
  // QR Scanner functionality
  initQRScanner();
  
  // Copy functionality for blockchain IDs
  initCopyToClipboard();
  
  // Form Validations
  validateForms();
});

/**
 * Initialize QR Scanner if available
 */
function initQRScanner() {
  const scannerButtons = document.querySelectorAll('.qr-scanner-trigger');
  
  if (scannerButtons.length > 0) {
    scannerButtons.forEach(button => {
      button.addEventListener('click', function() {
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
          // In a real app, we would initialize QR scanner here
          // For demo purposes, we'll just show an alert
          alert('QR Scanner would open here in a real application.');
        } else {
          alert('Your browser does not support camera access. Please enter the product code manually.');
        }
      });
    });
  }
}

/**
 * Initialize copy to clipboard functionality
 */
function initCopyToClipboard() {
  const copyButtons = document.querySelectorAll('.copy-to-clipboard');
  
  if (copyButtons.length > 0) {
    copyButtons.forEach(button => {
      button.addEventListener('click', function() {
        const textToCopy = this.getAttribute('data-clipboard-text');
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy)
            .then(() => {
              // Show success feedback
              const originalText = this.innerHTML;
              this.innerHTML = '<i class="fas fa-check"></i> Copied!';
              
              setTimeout(() => {
                this.innerHTML = originalText;
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
            });
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = 0;
          document.body.appendChild(textarea);
          textarea.select();
          
          try {
            document.execCommand('copy');
            // Show success feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
              this.innerHTML = originalText;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy text: ', err);
          } finally {
            document.body.removeChild(textarea);
          }
        }
      });
    });
  }
}

/**
 * Validate forms
 */
function validateForms() {
  const forms = document.querySelectorAll('.needs-validation');
  
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * Format blockchain address
 * @param {string} address - The blockchain address to format
 * @param {number} startLength - Number of characters to show at start
 * @param {number} endLength - Number of characters to show at end
 * @returns {string} - Formatted address
 */
function formatBlockchainAddress(address, startLength = 6, endLength = 4) {
  if (!address || address.length <= startLength + endLength) {
    return address || '';
  }
  
  return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
}

/**
 * Handle MetaMask connection
 * @param {HTMLElement} button - Button element that triggered the connection
 * @param {Function} callback - Callback function to execute after successful connection
 */
function connectMetaMask(button, callback) {
  if (typeof window.ethereum !== 'undefined') {
    button.setAttribute('disabled', true);
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Connecting...';
    
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        if (accounts.length > 0) {
          const address = accounts[0];
          button.classList.remove('btn-outline-primary');
          button.classList.add('btn-success');
          button.innerHTML = '<i class="fas fa-check me-2"></i> Connected';
          button.removeAttribute('disabled');
          
          if (typeof callback === 'function') {
            callback(address);
          }
        }
      })
      .catch(error => {
        console.error('MetaMask connection error:', error);
        button.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> Connection Failed';
        button.classList.add('btn-danger');
        
        setTimeout(() => {
          button.classList.remove('btn-danger');
          button.classList.add('btn-outline-primary');
          button.innerHTML = '<i class="fas fa-wallet me-2"></i> Connect MetaMask';
          button.removeAttribute('disabled');
        }, 3000);
      });
  } else {
    alert('MetaMask is not installed. Please install MetaMask to use this feature.');
    window.open('https://metamask.io/download/', '_blank');
  }
}

/**
 * Generate random blockchain transaction hash for demo purposes
 * @returns {string} Random hash
 */
function generateDemoTransactionHash() {
  const chars = '0123456789abcdef';
  let hash = '0x';
  
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return hash;
}
