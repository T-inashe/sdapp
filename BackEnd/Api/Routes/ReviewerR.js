import express from 'express';
import {
  createReviewer,
  getAllReviewers,
  getReviewerById,
  updateReviewer,
  getReviewByReviewer,
  markMessageAsAssigned,
  deleteReviewerById,
} from '../Controller/ReviewerC.js'; // Adjust the path as needed

const router = express.Router();

// POST: Create a new reviewer assignment
router.post('/', async (req, res) => {
  try {
    const reviewer = await createReviewer(req.body);
    res.status(201).json(reviewer);
  } catch (error) {
    res.status(500).json({ message: 'Error creating reviewer assignment', error: error.message });
  }
});

// GET: All reviewer assignments
router.get('/', async (req, res) => {
  try {
    const reviewers = await getAllReviewers();
    res.status(200).json(reviewers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviewer assignments', error: error.message });
  }
});

router.get('/reviews/:reviewerId', async (req, res) => {
  try {
    const reviewers = await  getReviewByReviewer(req.params.reviewerId);
    res.status(200).json(reviewers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Single reviewer assignment by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const reviewer = await getReviewerById(id);
    if (reviewer) {
      res.status(200).json(reviewer);
    } else {
      res.status(404).json({ message: 'Reviewer assignment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviewer assignment', error: error.message });
  }
});


// PUT: Update a reviewer assignment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedReviewer = await updateReviewer(id, req.body);
    res.status(200).json(updatedReviewer);
  } catch (error) {
    res.status(500).json({ message: 'Error updating reviewer assignment', error: error.message });
  }
});

router.put('/assigned/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedReview = await markMessageAsAssigned(id);
    res.status(200).json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error: error.message });
  }
});

// DELETE: Delete a reviewer assignment by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteReviewerById(id);
    if (result) {
      res.status(200).json({ message: 'Reviewer assignment deleted successfully' });
    } else {
      res.status(404).json({ message: 'Reviewer assignment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reviewer assignment', error: error.message });
  }
});


export default router;
