const Activity = require('../models/activityModel');

exports.refreshActivities = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện thao tác này'
      });
    }
    
    // Xóa cache hoạt động
    if (global.activitiesCache) {
      global.activitiesCache.delete(req.session.userId);
    }
    
    res.json({
      success: true,
      message: 'Làm mới hoạt động thành công'
    });
  } catch (error) {
    console.error('Lỗi khi làm mới hoạt động:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi làm mới hoạt động'
    });
  }
};
