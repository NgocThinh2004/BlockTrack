/**
 * Tiện ích giám sát tài nguyên hệ thống
 * - Theo dõi sử dụng bộ nhớ để phát hiện memory leak
 * - Ghi log tài nguyên hệ thống theo chu kỳ
 */
const os = require('os');
const v8 = require('v8');

class SystemMonitor {
  static startMemoryMonitoring(interval = 60000) { // Mặc định 1 phút
    console.log('Starting system resource monitoring...');

    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const v8HeapStats = v8.getHeapStatistics();
      
      const report = {
        timestamp: new Date().toISOString(),
        process: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        },
        v8Heap: {
          totalHeapSize: `${Math.round(v8HeapStats.total_heap_size / 1024 / 1024)} MB`,
          totalHeapSizeExecutable: `${Math.round(v8HeapStats.total_heap_size_executable / 1024 / 1024)} MB`,
          usedHeapSize: `${Math.round(v8HeapStats.used_heap_size / 1024 / 1024)} MB`,
          heapSizeLimit: `${Math.round(v8HeapStats.heap_size_limit / 1024 / 1024)} MB`,
          mallocedMemory: `${Math.round(v8HeapStats.malloced_memory / 1024 / 1024)} MB`,
        },
        system: {
          totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
          freeMemory: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
          cpuUsage: os.loadavg(),
          uptime: `${Math.round(os.uptime() / 3600)} hours`
        }
      };
      
      // Ghi log báo cáo tài nguyên
      console.log('===== SYSTEM RESOURCES REPORT =====');
      console.log(JSON.stringify(report, null, 2));
      
      // Kiểm tra rò rỉ bộ nhớ tiềm ẩn
      const heapUsedPercent = (memoryUsage.heapUsed / v8HeapStats.heap_size_limit) * 100;
      if (heapUsedPercent > 80) {
        console.warn(`WARNING: High memory usage detected (${heapUsedPercent.toFixed(2)}% of heap limit)`);
      }
      
    }, interval);
  }
  
  static startMonitoring() {
    this.startMemoryMonitoring();
    
    // Bắt các sự kiện quá tải
    process.on('warning', (warning) => {
      console.warn('Node.js warning:', warning.name, warning.message);
    });
  }
}

module.exports = SystemMonitor;
