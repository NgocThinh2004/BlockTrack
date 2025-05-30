const Activity = require('../models/activityModel');

/**
 * Controller xử lý hoạt động
 */

/**
 * Kiểm tra và debug hoạt động
 */
exports.debugActivities = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập'
      });
    }
    
    // Lấy hoạt động hiện tại
    const activities = await Activity.getActivitiesByUser(userId, 10);
    
    res.json({
      success: true,
      userId: userId,
      activities: activities
    });
  } catch (error) {
    console.error('Lỗi khi debug hoạt động:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
