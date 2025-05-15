import express from 'express';
import {
  createMessage,
  getMessagesBetweenUsers,
  getMessageById,
  getMessagesByUser,
  markMessageAsRead,
  markMessageAsDelivered,
  deleteMessageById,
  getMessagesByProjectId,
  deleteConversationBetweenUsers,
} from '../Controller/MessageC.js';

const router = express.Router();

// Create a new message
router.post('/', async (req, res) => {
  const newMessage = req.body;
  try {
    const message = await createMessage(newMessage);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error creating message', error: error.message });
  }
});

// Get all messages between two users
router.get('/', async (req, res) => {
  const { userA, userB } = req.query;
  if (!userA || !userB) {
    return res.status(400).json({ message: 'Both userA and userB IDs are required' });
  }

  try {
    const messages = await getMessagesBetweenUsers(userA, userB);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Get a single message by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const message = await getMessageById(id);
    if (message) {
      res.status(200).json(message);
    } else {
      res.status(404).json({ message: 'Message not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching message', error: error.message });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const messages = await getMessagesByProjectId(projectId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await getMessagesByUser(userId);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user messages', error: error.message });
  }
});

// Mark a message as read
router.put('/read/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMessage = await markMessageAsRead(id);
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error: error.message });
  }
});

// Mark a message as delivered
router.patch('/delivered/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMessage = await markMessageAsDelivered(id);
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as delivered', error: error.message });
  }
});

// Delete a single message
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteMessageById(id);
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

// Delete entire conversation between two users
router.delete('/conversation', async (req, res) => {
  const { userA, userB } = req.query;
  if (!userA || !userB) {
    return res.status(400).json({ message: 'Both userA and userB IDs are required' });
  }

  try {
    const result = await deleteConversationBetweenUsers(userA, userB);
    res.status(200).json({ message: 'Conversation deleted successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting conversation', error: error.message });
  }
});

export default router;
