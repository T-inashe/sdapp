import express from 'express';
import {
  createCollaborator,
  getAllCollaborators,
  getCollaboratorById,
  updateCollaborator,
  deleteCollaboratorById,
  getInvitesByReceiverId,
  getApplicationRequestsBySenderId,
  acceptApplication,
  acceptInvite,
  declineInvite,
} from '../Controller/CollaboratorC.js'; // Adjust path as needed

const router = express.Router();

// POST: Create a new invite/collaborator
router.post('/', async (req, res) => {
  try {
    const collaborator = await createCollaborator(req.body);
    res.status(201).json(collaborator);
  } catch (error) {
    res.status(500).json({ message: 'Error creating collaborator', error: error.message });
  }
});

// GET: All collaborators (admin/debug)
router.get('/', async (req, res) => {
  try {
    const collaborators = await getAllCollaborators();
    res.status(200).json(collaborators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching collaborators', error: error.message });
  }
});

// GET: Collaborators sent to a user
router.get('/receiver/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const invites = await getInvitesByReceiverId(userId);
    res.status(200).json(invites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user invites', error: error.message });
  }
});

router.get('/request/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await getApplicationRequestsBySenderId(userId);
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user requests', error: error.message });
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

// PUT: Update a collaborator (admin/debug)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedCollaborator = await updateCollaborator(id, req.body);
    res.status(200).json(updatedCollaborator);
  } catch (error) {
    res.status(500).json({ message: 'Error updating collaborator', error: error.message });
  }
});

// PUT: Accept an invite
router.put('/:id/accept', async (req, res) => {
  const { id } = req.params;
  try {
    const acceptedInvite = await acceptInvite(id);
    res.status(200).json(acceptedInvite);
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invite', error: error.message });
  }
});

router.put('/:id/acceptapplication', async (req, res) => {
  const { id } = req.params;
  try {
    const acceptedapplication = await acceptApplication(id);
    res.status(200).json(acceptedapplication);
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invite', error: error.message });
  }
});


// PUT: Decline an invite
router.put('/:id/decline', async (req, res) => {
  const { id } = req.params;
  try {
    const declinedInvite = await declineInvite(id);
    res.status(200).json(declinedInvite);
  } catch (error) {
    res.status(500).json({ message: 'Error declining invite', error: error.message });
  }
});

// DELETE: Delete a collaborator
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
