import express from 'express';
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  markNotificationAsRead,
  deleteNotificationById,
} from '../Controller/NotificationC.js';

const router = express.Router();


router.post('/', async (req, res) => {
  const newNotification = req.body;
  try {
    const notification = await createNotification(newNotification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});


router.get('/', async (req, res) => {
  const userId = req.query.user; // Get userId from query parameter
  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const notifications = await getAllNotifications(userId);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});



router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await getNotificationById(id);
    if (notification) {
      res.status(200).json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification', error: error.message });
  }
});


router.put('/read/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedNotification = await markNotificationAsRead(id);
    if (updatedNotification) {
      res.status(200).json(updatedNotification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteNotificationById(id);
    if (result) {
      res.status(200).json({ message: 'Notification deleted successfully' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

export default router;
