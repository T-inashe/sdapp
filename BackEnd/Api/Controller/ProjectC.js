import ResearchProject from "../Models/Project.js";
import Notification from "../Models/Notification.js";

export const createResearchProject = async (payload, file) => {
  try {

    let fileData = {};
    if (file) {
      fileData = {
        data: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname,
      };
    }
    const newProject = new ResearchProject({
      ...payload,
      file: fileData,
    });

    const savedProject = await newProject.save();

    // Optional: Notify the creator
    const notification = new Notification({
      message: `Your research project "${savedProject.title}" was successfully created.`,
      user: savedProject.creator, // Notify the creator
      type: 'success',
    });

    await notification.save();

    return savedProject;
  } catch (error) {
    throw new Error(`Error creating research project: ${error.message}`);
  }
};

export const getReviewByReviewer = async (file) => {
  try {
    const file = await ResearchProject.find({ file:file });
    return file;
  } catch (error) {
    throw new Error(`Error fetching Review for reviewer ${file}: ${error.message}`);
  }
};


// READ all research projects
export const getAllResearchProjects = async () => {
  try {
    const projects = await ResearchProject.find().populate('creator');
    return projects;
  } catch (error) {
    throw new Error(`Error fetching research projects: ${error.message}`);
  }
};


export const getResearchProjectsByCreator = async (creatorId) => {
  try {
    const projects = await ResearchProject.find({ creator: creatorId });
    return projects;
  } catch (error) {
    throw new Error(`Error fetching projects for creator ${creatorId}: ${error.message}`);
  }
};

// READ a research project by ID
export const getResearchProjectById = async (id) => {
  try {
    const project = await ResearchProject.findById(id).populate('creator');
    if (!project) {
      throw new Error("Research project not found");
    }
    return project;
  } catch (error) {
    throw new Error(`Error fetching research project: ${error.message}`);
  }
};

// UPDATE a research project
export const updateResearchProject = async (id, payload) => {
  try {
    const project = await ResearchProject.findById(id);
    if (!project) {
      throw new Error("Research project not found");
    }

    Object.keys(payload).forEach((key) => {
      project[key] = payload[key];
    });

    const updatedProject = await project.save();
    return updatedProject;
  } catch (error) {
    throw new Error(`Error updating research project: ${error.message}`);
  }
};

// DELETE a research project
export const deleteResearchProjectById = async (id) => {
  try {
    const result = await ResearchProject.findByIdAndDelete(id);
    if (!result) {
      throw new Error("Research project not found");
    }
    return result;
  } catch (error) {
    throw new Error(`Error deleting research project: ${error.message}`);
  }
};
