/**
 * Tiện ích ghi log đơn giản hóa
 */
class RouteLogger {
  logNotFound(path, userAgent) {
    console.log(`404 Error - Path: ${path}, User Agent: ${userAgent}`);
  }
}

module.exports = new RouteLogger();
