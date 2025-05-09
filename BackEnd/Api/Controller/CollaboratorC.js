import Collaborator from '../Models/Collaborator.js';
import Notification from '../Models/Notification.js';

// CREATE a collaborator
export const createCollaborator = async (payload) => {
  try {
    const newCollaborator = new Collaborator({
      ...payload,
    });

    const savedCollaborator = await newCollaborator.save();
    return savedCollaborator;
  } catch (error) {
    throw new Error(`Error creating collaborator: ${error.message}`);
  }
};

// READ all collaborators
export const getAllCollaborators = async () => {
  try {
    const collaborators = await Collaborator.find().populate('project_id');
    return collaborators;
  } catch (error) {
    throw new Error(`Error fetching collaborators: ${error.message}`);
  }
};

// READ a collaborator by ID
export const getCollaboratorById = async (id) => {
  try {
    const collaborator = await Collaborator.findById(id).populate('project_id');
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }
    return collaborator;
  } catch (error) {
    throw new Error(`Error fetching collaborator: ${error.message}`);
  }
};

// UPDATE a collaborator
export const updateCollaborator = async (id, payload) => {
  try {
    const collaborator = await Collaborator.findById(id);
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    Object.keys(payload).forEach((key) => {
      collaborator[key] = payload[key];
    });

    const updatedCollaborator = await collaborator.save();
    return updatedCollaborator;
  } catch (error) {
    throw new Error(`Error updating collaborator: ${error.message}`);
  }
};

// DELETE a collaborator
export const deleteCollaboratorById = async (id) => {
  try {
    const result = await Collaborator.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Collaborator not found');
    }
    return result;
  } catch (error) {
    throw new Error(`Error deleting collaborator: ${error.message}`);
  }
};
