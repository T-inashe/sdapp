import Grant from "../Models/Grant.js";

// Create a new grant
export const createGrant = async (payload) => {
  try {
    const newGrant = new Grant(payload);
    const savedGrant = await newGrant.save();
    return savedGrant;
  } catch (error) {
    throw new Error(`Error creating grant: ${error.message}`);
  }
};

// Get all grants
export const getAllGrants = async () => {
  try {
    const grants = await Grant.find().populate('researcher');
    return grants;
  } catch (error) {
    throw new Error(`Error fetching grants: ${error.message}`);
  }
};

// Get a grant by ID
export const getGrantById = async (id) => {
  try {
    const grant = await Grant.findById(id).populate('researcher');
    if (!grant) {
      throw new Error('Grant not found');
    }
    return grant;
  } catch (error) {
    throw new Error(`Error fetching grant: ${error.message}`);
  }
};

// Update a grant
export const updateGrant = async (id, payload) => {
  try {
    const grant = await Grant.findById(id);
    if (!grant) {
      throw new Error('Grant not found');
    }

    // Update fields from payload
    Object.keys(payload).forEach((key) => {
      grant[key] = payload[key];
    });

    // Recalculate remaining before saving
    grant.remaining = grant.awarded - grant.spent;

    const updatedGrant = await grant.save();
    return updatedGrant;
  } catch (error) {
    throw new Error(`Error updating grant: ${error.message}`);
  }
};

// Delete a grant
export const deleteGrantById = async (id) => {
  try {
    const result = await Grant.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Grant not found');
    }
    return result;
  } catch (error) {
    throw new Error(`Error deleting grant: ${error.message}`);
  }
};
