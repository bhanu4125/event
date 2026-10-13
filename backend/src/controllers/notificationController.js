import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('event', 'title status posterUrl')
      .populate('sender', 'name role')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id }, { isRead: true });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
