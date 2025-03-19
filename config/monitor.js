const SystemMonitor = require('../utils/monitoring');

/**
 * Kích hoạt giám sát hệ thống
 * - Kích hoạt nếu NODE_ENV=production hoặc ENABLE_MONITORING=true
 */
const enableMonitoring = () => {
  const shouldMonitor = process.env.NODE_ENV === 'production' || 
                       process.env.ENABLE_MONITORING === 'true';
  
  if (shouldMonitor) {
    console.log('System monitoring enabled');
    SystemMonitor.startMonitoring();
  } else {
    console.log('System monitoring disabled');
  }
};

module.exports = enableMonitoring;
