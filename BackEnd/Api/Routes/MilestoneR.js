// routes/milestoneRoutes.js

import express from 'express';
import {
  createMilestone,
  getMilestonesByProject,
  getMilestoneById,
  getMilestonesByUser,
  updateMilestone,
  deleteMilestoneById,
} from '../Controller/MilestoneC.js';

const router = express.Router();

// Get milestones by project ID
router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const milestones = await getMilestonesByProject(projectId);
    res.status(200).json(milestones);
  } catch (error) {
    console.error('Failed to fetch milestones by projectId:', error);
    res.status(500).json({ message: 'Failed to fetch milestones', error: error.message });
  }
});

// Get milestone by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const milestone = await getMilestoneById(id);
    if (milestone) {
      res.status(200).json(milestone);
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    console.error('Error fetching milestone:', error);
    res.status(500).json({ message: 'Error fetching milestone', error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const milestone = await getMilestonesByUser(userId);
    res.json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// Create a new milestone
router.post('/', async (req, res) => {
  try {
    const milestone = await createMilestone(req.body);
    res.status(201).json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ message: 'Error creating milestone', error: error.message });
  }
});

// Update milestone by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMilestone = await updateMilestone(id, req.body);
    if (updatedMilestone) {
      res.status(200).json(updatedMilestone);
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ message: 'Error updating milestone', error: error.message });
  }
});

// Delete milestone by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteMilestoneById(id);
    if (deleted) {
      res.status(200).json({ message: 'Milestone deleted successfully' });
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ message: 'Error deleting milestone', error: error.message });
  }
});

export default router;
