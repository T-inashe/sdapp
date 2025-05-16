import express from 'express';
import {
  createResearchProject,
  getAllResearchProjects,
  getResearchProjectById,
  updateResearchProject,
  deleteResearchProjectById,
  getResearchProjectsByCreator,
} from '../Controller/ProjectC.js'; // Importing correct project-related controllers
<<<<<<< HEAD

const router = express.Router();

// POST: Create a new research project
router.post('/projects', async (req, res) => {
  try {
    const resource = await createResearchProject(req.body); // Assuming req.body contains necessary project info
=======
import multer from 'multer';
const router = express.Router();


const upload = multer({ storage: multer.memoryStorage() });
// POST: Create a new research project
router.post('/projects',upload.single('file'), async (req, res) => {

  const { file } = req;
  try {
    const resource = await createResearchProject(req.body, file); // Assuming req.body contains necessary project info
>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
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

<<<<<<< HEAD
=======
// GET: Download file by project ID
router.get('/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const project = await getResearchProjectById(id);

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
router.get('/creator/:creatorId', async (req, res) => {
  try {
    const projects = await getResearchProjectsByCreator(req.params.creatorId);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update a research project
<<<<<<< HEAD
router.put('/projects/:id', async (req, res) => {
=======
router.put('/projects/:id',upload.single('file'), async (req, res) => {
>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
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
