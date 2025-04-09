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

/**
 * Thêm hoạt động test
 */
exports.addTestActivity = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập'
      });
    }
    
    const success = await Activity.addTestActivity(userId);
    
    res.json({
      success: success,
      message: success ? 'Đã thêm hoạt động test thành công' : 'Lỗi khi thêm hoạt động test'
    });
  } catch (error) {
    console.error('Lỗi khi thêm hoạt động test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
