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
      
      // Tạo key để phát hiện trùng lặp
      const cacheKey = `${activityData.userId}_${activityData.type}_${activityData.entityId || ''}_${activityData.entityName || ''}`;
      
      // Kiểm tra hoạt động trùng lặp trong thời gian gần đây (5 giây)
      const now = Date.now();
      if (recentActivitiesCache.has(cacheKey)) {
        const cachedTime = recentActivitiesCache.get(cacheKey);
        // Nếu hoạt động tương tự đã được ghi trong 5 giây trước, bỏ qua
        if (now - cachedTime < 5000) {
          console.log('Phát hiện hoạt động trùng lặp, bỏ qua:', cacheKey);
          return null;
        }
      }
      
      // Thêm vào cache để tránh trùng lặp
      recentActivitiesCache.set(cacheKey, now);
      
      // Dọn cache cũ định kỳ (giữ cache trong 10 phút)
      const TEN_MINUTES = 10 * 60 * 1000;
      for (const [key, timestamp] of recentActivitiesCache.entries()) {
        if (now - timestamp > TEN_MINUTES) {
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
      // Return null thay vì empty object để dễ debug hơn
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
      
      try {
        // Thử sử dụng orderBy để sắp xếp theo thời gian giảm dần
        const snapshot = await activitiesCollection
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get();
        
        console.log(`Đã lấy được ${snapshot.size} hoạt động từ database với orderBy`);
        return snapshot.docs.map(doc => {
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
      } catch (indexError) {
        // Nếu không có index, sử dụng cách khác không cần orderBy
        console.warn('Lỗi index trong Firestore, sử dụng phương pháp thay thế');
        const fallbackSnapshot = await activitiesCollection
          .where('userId', '==', userId)
          .limit(100)  // Lấy nhiều hơn để đảm bảo có đủ dữ liệu sau khi sắp xếp
          .get();
        
        console.log(`Sử dụng phương pháp thay thế. Lấy ${fallbackSnapshot.size} hoạt động`);
        
        if (fallbackSnapshot.empty) {
          console.log('Không có hoạt động nào cho userId:', userId);
          return [];
        }
        
        // Chuyển đổi snapshot thành array và xử lý timestamp
        const activities = fallbackSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Xử lý timestamp từ Firestore
          let timestamp;
          if (data.timestamp) {
            if (typeof data.timestamp.toDate === 'function') {
              timestamp = data.timestamp.toDate();
            } else if (data.timestamp instanceof Date || !isNaN(new Date(data.timestamp))) {
              timestamp = new Date(data.timestamp);
            } else {
              timestamp = new Date(); // Fallback
            }
          } else {
            timestamp = new Date(); // Default
          }
          
          return {
            id: doc.id,
            ...data,
            timestamp: timestamp
          };
        });
        
        // Sắp xếp theo thời gian (mới nhất trước)
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        // Giới hạn kết quả theo limit
        const limitedActivities = activities.slice(0, limit);
        
        console.log(`Trả về ${limitedActivities.length} hoạt động đã sắp xếp`);
        
        // Debug log hoạt động đầu tiên
        if (limitedActivities.length > 0) {
          console.log('Hoạt động đầu tiên:', JSON.stringify({
            id: limitedActivities[0].id,
            type: limitedActivities[0].type,
            description: limitedActivities[0].description,
            timestamp: limitedActivities[0].timestamp
          }));
        }
        
        return limitedActivities;
      }
    } catch (error) {
      console.error('Lỗi khi lấy hoạt động:', error);
      return [];
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
