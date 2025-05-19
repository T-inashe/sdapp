import express from 'express';
import {
  createFunder,
  getAllFunders,
  getFunderById,
  getFundingsByUser,
  updateFunder,
  deleteFunderById,
  getFundByProjectId,
} from '../Controller/FunderC.js';

const router = express.Router();

// Get all funders
router.get('/', async (req, res) => {
  try {
    const funders = await getAllFunders();
    res.status(200).json(funders);
  } catch (error) {
    console.error('Failed to fetch funders:', error);
    res.status(500).json({ message: 'Failed to fetch funders', error: error.message });
  }
});

// Get funder by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const funder = await getFunderById(id);
    if (funder) {
      res.status(200).json(funder);
    } else {
      res.status(404).json({ message: 'Funder not found' });
    }
  } catch (error) {
    console.error('Error fetching funder:', error);
    res.status(500).json({ message: 'Error fetching funder', error: error.message });
  }
});

router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const Fund = await getFundByProjectId(projectId);
    res.status(200).json(Fund);
  } catch (error) {
    console.error('Failed to fetch fund by projectId:', error);
    res.status(500).json({ error: 'Failed to fetch fund for project' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const fundings = await getFundingsByUser(userId);
    res.json(fundings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new funder
router.post('/', async (req, res) => {
  try {
    const funder = await createFunder(req.body);
    res.status(201).json(funder);
  } catch (error) {
    console.error('Error creating funder:', error);
    res.status(500).json({ message: 'Error creating funder', error: error.message });
  }
});

// Update funder by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedFunder = await updateFunder(id, req.body);
    if (updatedFunder) {
      res.status(200).json(updatedFunder);
    } else {
      res.status(404).json({ message: 'Funder not found' });
    }
  } catch (error) {
    console.error('Error updating funder:', error);
    res.status(500).json({ message: 'Error updating funder', error: error.message });
  }
});

// Delete funder by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteFunderById(id);
    if (deleted) {
      res.status(200).json({ message: 'Funder deleted successfully' });
    } else {
      res.status(404).json({ message: 'Funder not found' });
    }
  } catch (error) {
    console.error('Error deleting funder:', error);
    res.status(500).json({ message: 'Error deleting funder', error: error.message });
  }
});

export default router;
