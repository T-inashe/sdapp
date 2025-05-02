import express from 'express';
import {
  createResearchProject,
  getAllResearchProjects,
  getResearchProjectById,
  updateResearchProject,
  deleteResearchProjectById,
} from '../Controller/ProjectC.js'; // Importing correct project-related controllers

const router = express.Router();

// POST: Create a new research project
router.post('/projects', async (req, res) => {
  try {
    const resource = await createResearchProject(req.body); // Assuming req.body contains necessary project info
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Error creating research project', error: error.message });
  }
});

// GET: All research projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await getAllResearchProjects();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching research projects', error: error.message });
  }
});

// GET: Single research project by ID
router.get('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const project = await getResearchProjectById(id);
    if (project) {
      res.status(200).json(project);
    } else {
      res.status(404).json({ message: 'Research project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching research project', error: error.message });
  }
});

// PUT: Update a research project
router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedProject = await updateResearchProject(id, req.body); // Assuming req.body contains update info
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Error updating research project', error: error.message });
  }
});

// DELETE: Delete a research project by ID
router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteResearchProjectById(id);
    if (result) {
      res.status(200).json({ message: 'Research project deleted successfully' });
    } else {
      res.status(404).json({ message: 'Research project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting research project', error: error.message });
  }
});

export default router;
