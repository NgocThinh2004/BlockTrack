/**
 * Tiện ích kiểm tra kết nối cơ sở dữ liệu và dịch vụ
 */
const firebase = require('firebase/app');

class ConnectionChecker {
  static async checkFirebaseConnection() {
    try {
      // Kiểm tra bằng cách thử truy vấn đơn giản
      const testRef = firebase.firestore().collection('connectionTest').doc('test');
      await testRef.set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      return { connected: true };
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return { connected: false, error: error.message };
    }
  }
  
  static async checkAllConnections() {
    const firebaseStatus = await this.checkFirebaseConnection();
    
    return {
      firebase: firebaseStatus,
      allConnected: firebaseStatus.connected
    };
  }
}

module.exports = ConnectionChecker;
