import { Request, Response } from 'express';
import Milestone from '../Models/Milestone';

// Create a new milestone
export const createMilestone = async (req, res) => {
  try {
    const milestone = new Milestone(req.body);
    await milestone.save();
    res.status(201).json(milestone);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update a milestone
export const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const milestone = await Milestone.findByIdAndUpdate(id, req.body, { new: true });
    res.json(milestone);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Delete a milestone
export const deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    await Milestone.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get milestones for a project
export const getMilestonesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const milestones = await Milestone.find({ projectId });
    res.json(milestones);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Export all controller methods
export default {
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestonesByProject
};