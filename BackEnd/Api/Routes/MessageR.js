import express from 'express';
import {
  createMessage,
  getMessagesBetweenUsers,
  getMessageById,
  getMessagesByUser,
  markMessageAsRead,
<<<<<<< HEAD
=======
  getUnreadMessageCountsByReceiver,
>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
  markMessageAsDelivered,
  deleteMessageById,
  getMessagesByProjectId,
  deleteConversationBetweenUsers,
} from '../Controller/MessageC.js';
<<<<<<< HEAD

const router = express.Router();

// Create a new message
router.post('/', async (req, res) => {
  const newMessage = req.body;
  try {
    const message = await createMessage(newMessage);
=======
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Create a new message
router.post('/',upload.single('file'), async (req, res) => {
  const { file } = req;
  const newMessage = req.body;
  try {
    const message = await createMessage(newMessage, file);
>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error creating message', error: error.message });
  }
});

<<<<<<< HEAD
=======
router.get('/unread-counts/:receiverId', async (req, res) => {
  const { receiverId } = req.params;

  try {
    const counts = await getUnreadMessageCountsByReceiver(receiverId);
    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
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

<<<<<<< HEAD
=======
router.get('/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const project = await getMessageById(id);

    if (!project || !project.file || !project.file.data) {
      return res.status(404).json({ message: 'File not found in project' });
    }

    const buffer = Buffer.from(project.file.data, 'base64');

    res.setHeader('Content-Type', project.file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${project.file.originalName}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
});

>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
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
