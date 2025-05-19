import Funder from '../Models/Funder.js';
import mongoose from 'mongoose';
import ResearchProject from '../Models/Project.js';


// Create a new funder
export const createFunder = async (payload) => {
  try {
    const funder = new Funder(payload);
    return await funder.save();
  } catch (error) {
    console.error('Error creating funder:', error);
    throw new Error('Failed to create funder');
  }
};

// Get all funders
export const getAllFunders = async () => {
  try {
    return await Funder.find();
  } catch (error) {
    console.error('Error fetching funders:', error);
    throw new Error('Failed to fetch funders');
  }
};

export const getFundByProjectId = async (projectId) => {
  try {
    const fund = await Funder.find({ projectId: projectId });
    return fund;
  } catch (error) {
    throw new Error(`Error fetching fund for project: ${error.message}`);
  }
};

// Get a funder by ID
export const getFunderById = async (id) => {
  try {
    return await Funder.findById(id);
  } catch (error) {
    console.error('Error fetching funder by ID:', error);
    throw new Error('Failed to fetch funder by ID');
  }
};

export const getFundingsByUser = async (userId) => {
  try {
    const fundings = await Funder.find()
      .populate({
        path: 'projectId',
        match: { creator: new mongoose.Types.ObjectId(userId) },
        select: 'title creator', 
      });
      
    const filteredFundings = fundings.filter(f => f.projectId !== null);

    return filteredFundings;
  } catch (error) {
    console.error('Error fetching fundings by user:', error);
    throw new Error('Failed to fetch fundings for user');
  }
};
// Update a funder by ID
export const updateFunder = async (id, payload) => {
  try {
    return await Funder.findByIdAndUpdate(id, payload, { new: true });
  } catch (error) {
    console.error('Error updating funder:', error);
    throw new Error('Failed to update funder');
  }
};

// Delete a funder by ID
export const deleteFunderById = async (id) => {
  try {
    return await Funder.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error deleting funder:', error);
    throw new Error('Failed to delete funder');
  }
};
