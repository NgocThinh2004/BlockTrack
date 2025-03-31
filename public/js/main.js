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
  
  // Initialize background slideshow if exists
  initBackgroundSlideshow();
});

/**
 * Initialize background slideshow on homepage
 */
function initBackgroundSlideshow() {
  const slides = document.querySelectorAll('.slide');
  
  if (slides.length > 0) {
    let slideIndex = 0;
    
    function showSlides() {
      // Hide all slides
      slides.forEach(slide => slide.classList.remove('active'));
      
      // Move to next slide
      slideIndex++;
      if (slideIndex >= slides.length) {
        slideIndex = 0;
      }
      
      // Show current slide
      slides[slideIndex].classList.add('active');
      
      // Change slide every 5 seconds
      setTimeout(showSlides, 5000);
    }
    
    // Start slideshow
    showSlides();
  }
}

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
          
          // Check if requireWallet is true and enable login button
          const requireWallet = document.querySelector('#requireWallet');
          if (requireWallet && requireWallet.value === 'true') {
            const loginButton = document.querySelector('#loginButton');
            if (loginButton) {
              loginButton.removeAttribute('disabled');
              loginButton.innerHTML = 'Đăng nhập';
            }
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
 * Disconnect wallet and clear connection data
 * @returns {boolean} - Return true to allow default link action
 */
function disconnectWallet() {
  console.log('Disconnecting wallet on logout');
  
  // Clear any wallet-related data from storage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('prevLoginUser');
    
    // Clear any other wallet-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('wallet') || key.includes('metamask') || key.includes('ethereum')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
  
  // Remove session storage wallet data
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('walletConnected');
    sessionStorage.removeItem('walletAddress');
  }
  
  // Try to "forget" this connection in MetaMask
  if (window.ethereum) {
    try {
      // Remove all event listeners to reset state
      ethereum.removeAllListeners?.();
      
      // Force a reload of the ethereum provider if possible
      if (ethereum.disconnect || ethereum._handleDisconnect) {
        try {
          ethereum.disconnect?.();
          ethereum._handleDisconnect?.();
        } catch (e) {
          console.log('Provider does not support disconnect method');
        }
      }
    } catch (e) {
      console.error('Error disconnecting wallet:', e);
    }
  }
  
  // Set a flag in the cookie to indicate wallet was disconnected
  document.cookie = "wallet_disconnected=true; path=/; max-age=300"; // 5 minutes expiry
  
  // Return true to allow the default link behavior (redirect to logout)
  return true;
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
