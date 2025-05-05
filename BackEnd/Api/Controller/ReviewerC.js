import Reviewer from '../Models/Reviewer.js';

// CREATE a reviewer assignment
export const createReviewer = async (payload) => {
  try {
    const newReviewer = new Reviewer({ ...payload });
    const savedReviewer = await newReviewer.save();
    return savedReviewer;
  } catch (error) {
    throw new Error(`Error creating reviewer assignment: ${error.message}`);
  }
};

// READ all reviewer assignments
export const getAllReviewers = async () => {
  try {
    const reviewers = await Reviewer.find()
      .populate('creator')
      .populate('reviewer');
    return reviewers;
  } catch (error) {
    throw new Error(`Error fetching reviewer assignments: ${error.message}`);
  }
};

export const getReviewByReviewer = async (reviewerId) => {
  try {
    const reviewers = await Reviewer.find({ reviewer: reviewerId }).populate('creator');
    return reviewers;
  } catch (error) {
    throw new Error(`Error fetching Review for reviewer ${reviewerId}: ${error.message}`);
  }
};

// READ a reviewer assignment by ID
export const getReviewerById = async (id) => {
  try {
    const reviewer = await Reviewer.findById(id)
      .populate('creator')
      .populate('reviewer');
    if (!reviewer) {
      throw new Error('Reviewer assignment not found');
    }
    return reviewer;
  } catch (error) {
    throw new Error(`Error fetching reviewer assignment: ${error.message}`);
  }
};

// UPDATE a reviewer assignment
export const updateReviewer = async (id, payload) => {
  try {
    const reviewer = await Reviewer.findById(id);
    if (!reviewer) {
      throw new Error('Reviewer assignment not found');
    }

    Object.keys(payload).forEach((key) => {
      reviewer[key] = payload[key];
    });

    const updatedReviewer = await reviewer.save();
    return updatedReviewer;
  } catch (error) {
    throw new Error(`Error updating reviewer assignment: ${error.message}`);
  }
};


export const markMessageAsAssigned = async (id) => {
  try {
    const reviewer = await Reviewer.findById(id);
    if (!reviewer) {
      throw new Error('Message not found');
    }
    reviewer.read = true;
    const updatedReview = await reviewer.save();
    return updatedReview;
  } catch (error) {
    throw new Error(`Error marking message as read: ${error.message}`);
  }
};

// DELETE a reviewer assignment
export const deleteReviewerById = async (id) => {
  try {
    const result = await Reviewer.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Reviewer assignment not found');
    }
    return result;
  } catch (error) {
    throw new Error(`Error deleting reviewer assignment: ${error.message}`);
  }
};
