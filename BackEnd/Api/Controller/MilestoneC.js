import Milestone from '../Models/Milestone.js';

// Create a new milestone
export const createMilestone = async (payload) => {
  try {
    const milestone = new Milestone(payload);
    return await milestone.save();
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw new Error('Failed to create milestone');
  }
};

// Get all milestones for a project
export const getMilestonesByProject = async (projectId) => {
  try {
    return await Milestone.find({ projectId });
  } catch (error) {
    console.error('Error fetching milestones by project:', error);
    throw new Error('Failed to fetch milestones');
  }
};

// Get a milestone by ID
export const getMilestoneById = async (id) => {
  try {
    return await Milestone.findById(id);
  } catch (error) {
    console.error('Error fetching milestone by ID:', error);
    throw new Error('Failed to fetch milestone by ID');
  }
};

// Update a milestone
export const updateMilestone = async (id, payload) => {
  try {
    return await Milestone.findByIdAndUpdate(id, payload, { new: true });
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw new Error('Failed to update milestone');
  }
};

// Delete a milestone
export const deleteMilestoneById = async (id) => {
  try {
    return await Milestone.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error deleting milestone:', error);
    throw new Error('Failed to delete milestone');
  }
};
