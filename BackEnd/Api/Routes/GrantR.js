import express from 'express';
import {
  createGrant,
  getAllGrants,
  getGrantById,
  updateGrant,
  deleteGrantById
} from '../Controller/GrantC.js';

const router = express.Router();

// Get all grants
router.get('/', async (req, res) => {
  try {
    const grants = await getAllGrants();
    res.status(200).json(grants);
  } catch (error) {
    console.error('Failed to fetch grants:', error);
    res.status(500).json({ error: 'Failed to fetch grants' });
  }
});

// Get a grant by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const grant = await getGrantById(id);
    if (grant) {
      res.status(200).json(grant);
    } else {
      res.status(404).json({ message: 'Grant not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grant', error: error.message });
  }
});

// Create a new grant
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const newGrant = await createGrant(payload);
    res.status(201).json(newGrant);
  } catch (error) {
    console.error('Error creating grant:', error);
    res.status(500).json({ message: 'Error creating grant', error: error.message });
  }
});

// Update a grant
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    const updatedGrant = await updateGrant(id, payload);
    if (updatedGrant) {
      res.status(200).json(updatedGrant);
    } else {
      res.status(404).json({ message: 'Grant not found' });
    }
  } catch (error) {
    console.error('Error updating grant:', error);
    res.status(500).json({ message: 'Error updating grant', error: error.message });
  }
});

// Delete a grant
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteGrantById(id);
    if (deleted) {
      res.status(200).json({ message: 'Grant deleted successfully' });
    } else {
      res.status(404).json({ message: 'Grant not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting grant', error: error.message });
  }
});

export default router;
