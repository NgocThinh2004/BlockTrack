const firebase = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Reference to activities collection
const activitiesCollection = firebase.firestore().collection('activities');

// Lưu cache để tránh tạo trùng lặp hoạt động
const recentActivitiesCache = new Map();

/**
 * Activity model để theo dõi hoạt động người dùng
 */
class Activity {
  /**
   * Thêm một hoạt động mới
   * @param {Object} activityData - Dữ liệu hoạt động
   * @returns {Object} - Hoạt động đã tạo
   */
  static async addActivity(activityData) {
    try {
      console.log('Thêm hoạt động mới:', JSON.stringify(activityData));
      
      // Validate required fields
      if (!activityData.userId) {
        console.error('Lỗi: Thiếu userId khi thêm hoạt động');
        return null;
      }
      
      // Tạo key để phát hiện trùng lặp - thêm timestamp để cải thiện unique key
      const cacheKey = `${activityData.userId}_${activityData.type}_${activityData.entityId || ''}_${activityData.entityName || ''}_${Date.now()}`;
      
      const now = Date.now();
      
      // Chỉ kiểm tra trùng lặp cho hoạt động không phải product_created
      if (activityData.type !== 'product_created' && recentActivitiesCache.has(cacheKey)) {
        const cachedTime = recentActivitiesCache.get(cacheKey);
        // Giảm thời gian kiểm tra trùng lặp xuống 2 giây
        if (now - cachedTime < 2000) {
          console.log('Phát hiện hoạt động trùng lặp, bỏ qua:', cacheKey);
          return null;
        }
      }
      
      // Thêm vào cache để tránh trùng lặp
      recentActivitiesCache.set(cacheKey, now);
      
      // Dọn cache cũ định kỳ (giữ cache trong 5 phút thay vì 10 phút)
      const FIVE_MINUTES = 5 * 60 * 1000;
      for (const [key, timestamp] of recentActivitiesCache.entries()) {
        if (now - timestamp > FIVE_MINUTES) {
          recentActivitiesCache.delete(key);
        }
      }
      
      const activityId = uuidv4();
      
      // Chuẩn bị dữ liệu hoạt động
      const activity = {
        id: activityId,
        userId: activityData.userId,
        type: activityData.type || 'unknown',
        entityId: activityData.entityId || '',
        entityName: activityData.entityName || '',
        entityType: activityData.entityType || 'unknown',
        description: activityData.description || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Lưu vào cơ sở dữ liệu
      await activitiesCollection.doc(activityId).set(activity);
      
      console.log('Đã thêm hoạt động thành công với ID:', activityId);

      // Thêm code debug để xác nhận hoạt động đã được thêm
      const addedActivity = await activitiesCollection.doc(activityId).get();
      if (addedActivity.exists) {
        console.log('Xác nhận: Hoạt động đã được lưu trong database');
      } else {
        console.error('Lỗi: Hoạt động không được lưu trong database');
      }
      
      return {
        ...activity,
        timestamp: new Date()  // Trả về timestamp dạng date để sử dụng ngay
      };
    } catch (error) {
      console.error('Lỗi khi thêm hoạt động:', error);
      return null;
    }
  }
  
  /**
   * Lấy hoạt động của người dùng 
   * @param {string} userId - ID người dùng
   * @param {number} limit - Số lượng hoạt động tối đa
   * @returns {Array} - Danh sách hoạt động
   */
  static async getActivitiesByUser(userId, limit = 5) {
    try {
      console.log(`Đang lấy ${limit} hoạt động cho người dùng: ${userId}`);
      
      let activities = [];
      let snapshot;
      
      // Cố gắng lấy hoạt động với orderBy
      try {
        snapshot = await activitiesCollection
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get();
        
        console.log(`Đã lấy được ${snapshot.size} hoạt động từ database với orderBy`);
        
        if (!snapshot.empty) {
          activities = snapshot.docs.map(doc => {
            const data = doc.data();
            // Chuẩn hóa timestamp
            let timestamp;
            if (data.timestamp) {
              if (typeof data.timestamp.toDate === 'function') {
                timestamp = data.timestamp.toDate();
              } else if (data.timestamp instanceof Date || !isNaN(new Date(data.timestamp))) {
                timestamp = new Date(data.timestamp);
              } else {
                timestamp = new Date();
              }
            } else {
              timestamp = new Date();
            }
            
            return {
              id: doc.id,
              ...data,
              timestamp: timestamp
            };
          });
          
          return activities;
        }
      } catch (error) {
        // Nếu lỗi là do thiếu index, thử phương pháp khác
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index not yet created for activities. Creating index is recommended.');
          // Tiếp tục thực hiện phương pháp thay thế
        } else {
          // Nếu là lỗi khác, ném lại để xử lý bên ngoài
          throw error;
        }
      }
      
      // Nếu không lấy được với orderBy hoặc không có kết quả, thử phương pháp khác
      if (!activities.length) {
        snapshot = await activitiesCollection
          .where('userId', '==', userId)
          .get();
        
        console.log(`Sử dụng phương pháp thay thế. Lấy ${snapshot.size} hoạt động`);
        
        if (!snapshot.empty) {
          // Chuyển đổi và xử lý timestamp
          activities = snapshot.docs.map(doc => {
            const data = doc.data();
            let timestamp;
            
            if (data.timestamp) {
              if (typeof data.timestamp.toDate === 'function') {
                timestamp = data.timestamp.toDate();
              } else if (data.timestamp instanceof Date || !isNaN(new Date(data.timestamp))) {
                timestamp = new Date(data.timestamp);
              } else {
                timestamp = new Date();
              }
            } else {
              timestamp = new Date();
            }
            
            return {
              id: doc.id,
              ...data,
              timestamp: timestamp
            };
          });
          
          // Sắp xếp theo thời gian giảm dần
          activities.sort((a, b) => b.timestamp - a.timestamp);
          
          // Giới hạn kết quả
          activities = activities.slice(0, limit);
        }
      }
      
      return activities;
    } catch (error) {
      console.error('Lỗi khi lấy hoạt động:', error);
      return []; // Trả về mảng rỗng thay vì ném lỗi
    }
  }
  
  /**
   * Force thêm hoạt động để test
   * @returns {Promise<boolean>} - Success status
   */
  static async addTestActivity(userId) {
    try {
      const result = await this.addActivity({
        userId: userId,
        type: 'test_activity',
        entityId: 'test',
        entityName: 'Test Activity',
        entityType: 'test',
        description: 'Hoạt động test được tạo lúc ' + new Date().toLocaleString('vi-VN')
      });
      
      return !!result;
    } catch (error) {
      console.error('Lỗi khi thêm hoạt động test:', error);
      return false;
    }
  }
  
  /**
   * Lấy tất cả hoạt động để debug
   */
  static async getAllActivities(limit = 20) {
    try {
      const snapshot = await activitiesCollection.limit(limit).get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : null
        };
      });
    } catch (error) {
      console.error('Lỗi khi lấy tất cả hoạt động:', error);
      return [];
    }
  }
}

module.exports = Activity;
