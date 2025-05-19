import Collaborator from '../Models/Collaborator.js';
import ResearchProject from '../Models/Project.js';
import Notification from '../Models/Notification.js';

// CREATE an invite
export const createCollaborator = async (payload) => {
  try {
    const newCollaborator = new Collaborator({ ...payload });
    const savedCollaborator = await newCollaborator.save();

    // Send a notification to the receiver
    const newNotification = new Notification({
      message: `You have been invited to collaborate on a project.`,
      user: payload.receiver,
      type: 'Invite',
    });
    await newNotification.save();

    return savedCollaborator;
  } catch (error) {
    throw new Error(`Error creating collaborator: ${error.message}`);
  }
};

// GET all invites (for admin/debug)
export const getAllCollaborators = async () => {
  try {
    const collaborators = await Collaborator.find()
      .populate('project')
      .populate('sender')
      .populate('receiver');
    return collaborators;
  } catch (error) {
    throw new Error(`Error fetching collaborators: ${error.message}`);
  }
};

// GET single invite by ID
export const getCollaboratorById = async (id) => {
  try {
    const collaborator = await Collaborator.findById(id)
      .populate('project')
      .populate('sender')
      .populate('receiver');

    if (!collaborator) {
      throw new Error('Collaborator not found');
    }
    return collaborator;
  } catch (error) {
    throw new Error(`Error fetching collaborator: ${error.message}`);
  }
};

// GET invites sent to a specific user
export const getInvitesByReceiverId = async (userId) => {
  try {
    const requests = await Collaborator.find({
      receiver: userId,
      type: 'invite', // only application type
    })
      .populate('project')
      .populate('sender');

    return requests;
  } catch (error) {
    throw new Error(`Error fetching application requests: ${error.message}`);
  }
};

export const  getApplicationRequestsBySenderId = async (userId) => {
  try {
    const requests = await Collaborator.find({
      type: 'application',
      $or: [
        { receiver: userId },
        { sender: userId },
      ],
    })
      .populate('project')
      .populate('sender')
      .populate('receiver');

    return requests;
  } catch (error) {
    throw new Error(`Error fetching application requests: ${error.message}`);
  }
};
// ACCEPT an invite
export const acceptInvite = async (inviteId) => {
  try {
    const invite = await Collaborator.findById(inviteId)
      .populate('receiver', 'fname lname')
      .populate('sender', 'fname lname');

    if (!invite || invite.status !== 'Pending') {
      throw new Error('Invite not found or already responded to');
    }

    invite.status = 'Accepted';
    invite.respondedAt = new Date();
    await invite.save();

    await ResearchProject.findByIdAndUpdate(invite.project, {
      $addToSet: { collaborators: invite.receiver._id },
    });

    const notification = new Notification({
      message: `${invite.receiver.fname} ${invite.receiver.lname} accepted your project invite.`,
      user: invite.sender._id,
      type: 'success',
    });
    await notification.save();

    return invite;
  } catch (error) {
    throw new Error(`Error accepting invite: ${error.message}`);
  }
};

export const acceptApplication = async (inviteId) => {
  try {
    const invite = await Collaborator.findById(inviteId)
      .populate('receiver', 'fname lname')
      .populate('sender', 'fname lname');

    if (!invite || invite.status !== 'Pending') {
      throw new Error('Invite not found or already responded to');
    }

    invite.status = 'Accepted';
    invite.respondedAt = new Date();
    await invite.save();

    await ResearchProject.findByIdAndUpdate(invite.project, {
      $addToSet: { collaborators: invite.sender._id },
    });

    const notification = new Notification({
      message: `${invite.sender.fname} ${invite.sender.lname} accepted your project invite.`,
      user: invite.receiver._id,
      type: 'success',
    });
    await notification.save();

    return invite;
  } catch (error) {
    throw new Error(`Error accepting invite: ${error.message}`);
  }
};



// DECLINE an invite
export const declineInvite = async (inviteId) => {
  try {
    const invite = await Collaborator.findById(inviteId)
      .populate('receiver', 'fname lname')
      .populate('sender', 'fname lname');

    if (!invite || invite.status !== 'Pending') {
      throw new Error('Invite not found or already responded to');
    }

    invite.status = 'Declined';
    invite.respondedAt = new Date();
    await invite.save();

    const notification = new Notification({
      message: `${invite.receiver.fname} ${invite.receiver.lname} declined your project invite.`,
      user: invite.sender._id,
      type: 'InviteDeclined',
    });
    await notification.save();

    return invite;
  } catch (error) {
    throw new Error(`Error declining invite: ${error.message}`);
  }
};


// DELETE invite
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

// UPDATE invite (admin use)
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
