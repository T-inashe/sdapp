import Notification from '../Models/Notification.js';


export const createNotification = async (payload) => {
  try {
    const newNotification = new Notification(payload);
    const savedNotification = await newNotification.save();
    return savedNotification;
  } catch (error) {
    throw new Error(`Error creating notification: ${error.message}`);
  }
};


export const getAllNotifications = async (userId) => {
  try {
    // Filter notifications by userId
    const notifications = await Notification.find({ user: userId }).populate('user');
    return notifications;
  } catch (error) {
    throw new Error(`Error fetching notifications: ${error.message}`);
  }
};


export const getNotificationById = async (id) => {
  try {
    const notification = await Notification.findById(id).populate('user');
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  } catch (error) {
    throw new Error(`Error fetching notification: ${error.message}`);
  }
};


export const markNotificationAsRead = async (id) => {
  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.read = true;
    const updatedNotification = await notification.save();
    return updatedNotification;
  } catch (error) {
    throw new Error(`Error updating notification: ${error.message}`);
  }
};


export const deleteNotificationById = async (id) => {
  try {
    const result = await Notification.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Notification not found');
    }
    return result;
  } catch (error) {
    throw new Error(`Error deleting notification: ${error.message}`);
  }
};
