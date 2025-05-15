import express from 'express';
import {
  createCollaborator,
  getAllCollaborators,
  getCollaboratorById,
  updateCollaborator,
  deleteCollaboratorById,
} from '../Controller/CollaboratorC.js'; // Adjust path as needed

const router = express.Router();

// POST: Create a new collaborator
router.post('/', async (req, res) => {
  try {
    const collaborator = await createCollaborator(req.body);
    res.status(201).json(collaborator);
  } catch (error) {
    res.status(500).json({ message: 'Error creating collaborator', error: error.message });
  }
});

// GET: All collaborators
router.get('/', async (req, res) => {
  try {
    const collaborators = await getAllCollaborators();
    res.status(200).json(collaborators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching collaborators', error: error.message });
  }
});

// GET: Single collaborator by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const collaborator = await getCollaboratorById(id);
    if (collaborator) {
      res.status(200).json(collaborator);
    } else {
      res.status(404).json({ message: 'Collaborator not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching collaborator', error: error.message });
  }
});

// PUT: Update a collaborator
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedCollaborator = await updateCollaborator(id, req.body);
    res.status(200).json(updatedCollaborator);
  } catch (error) {
    res.status(500).json({ message: 'Error updating collaborator', error: error.message });
  }
});

// DELETE: Delete a collaborator by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteCollaboratorById(id);
    if (result) {
      res.status(200).json({ message: 'Collaborator deleted successfully' });
    } else {
      res.status(404).json({ message: 'Collaborator not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting collaborator', error: error.message });
  }
});

export default router;
