const firebase = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// Reference to activities collection
const activitiesCollection = firebase.firestore().collection('activities');

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
      const activityId = uuidv4();
      
      // Chuẩn bị dữ liệu hoạt động
      const activity = {
        id: activityId,
        userId: activityData.userId,
        type: activityData.type, // Ví dụ: 'product_created', 'stage_added', etc.
        entityId: activityData.entityId, // ID của đối tượng liên quan (sản phẩm, giai đoạn...)
        entityName: activityData.entityName, // Tên của đối tượng liên quan
        entityType: activityData.entityType, // Loại đối tượng (product, stage)
        description: activityData.description,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Lưu vào cơ sở dữ liệu
      await activitiesCollection.doc(activityId).set(activity);
      
      return activity;
    } catch (error) {
      console.error('Lỗi khi thêm hoạt động:', error);
      // Return empty object instead of throwing to prevent app crash
      return {};
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
      let snapshot;
      let usingSortedQuery = true;
      
      try {
        // Thử truy vấn với sắp xếp (yêu cầu index)
        snapshot = await activitiesCollection
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get();
      } catch (error) {
        // Nếu lỗi index, quay lại truy vấn đơn giản
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index not yet created for activities, falling back to non-sorted query');
          console.warn('Please create the required index for the activities collection');
          snapshot = await activitiesCollection
            .where('userId', '==', userId)
            .limit(limit * 2) // Lấy nhiều hơn để đảm bảo đủ sau khi sắp xếp
            .get();
          usingSortedQuery = false;
        } else {
          throw error; // Ném lỗi nếu không phải lỗi index
        }
      }
      
      let activities = snapshot.docs.map(doc => {
        const data = doc.data();
        // Xử lý đặc biệt cho timestamp từ Firestore
        let timestamp = data.timestamp;
        if (timestamp && typeof timestamp.toDate === 'function') {
          timestamp = timestamp.toDate();
        } else if (timestamp) {
          timestamp = new Date(timestamp);
        } else {
          timestamp = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          timestamp: timestamp
        };
      });
      
      // Nếu dùng truy vấn dự phòng, sắp xếp kết quả thủ công
      if (!usingSortedQuery) {
        activities.sort((a, b) => b.timestamp - a.timestamp);
        activities = activities.slice(0, limit); // Giới hạn kết quả
      }
      
      return activities;
    } catch (error) {
      console.error('Lỗi khi lấy hoạt động:', error);
      return [];
    }
  }
}

module.exports = Activity;
