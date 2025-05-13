import Message from '../Models/Message.js';

// Create a new message
export const createMessage = async (payload, file) => {
  let fileData = {};

  if (file) {
    fileData = {
      data: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
    };
  }

  try {
    const newMessage = new Message({
      ...payload,
      file: fileData,
    });

    const savedMessage = await newMessage.save();
    return savedMessage;
  } catch (error) {
    throw new Error(`Error creating message: ${error.message}`);
  }
};


import mongoose from 'mongoose';

export const getUnreadMessageCountsByReceiver = async (receiverId) => {
  try {
    const counts = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(receiverId), // FIXED: ensure correct type
          read: false
        }
      },
      {
        $group: {
          _id: '$sender',
          unreadCount: { $sum: 1 }
        }
      },
      {
        $project: {
          senderId: '$_id',
          unreadCount: 1,
          _id: 0
        }
      }
    ]);
    return counts;
  } catch (error) {
    throw new Error(`Error fetching unread counts: ${error.message}`);
  }
};


export const getMessagesByUser = async (userId) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender receiver')
      .sort({ createdAt: -1 });
    return messages;
  } catch (error) {
    throw new Error(`Error fetching messages for user: ${error.message}`);
  }
};

export const getMessagesByProjectId = async (projectId) => {
  try {
    const messages = await Message.find({ projectId })
      .populate('sender receiver') 
      .sort({ createdAt: 1 }); 
    return messages;
  } catch (error) {
    throw new Error(`Error fetching messages for project ID ${projectId}: ${error.message}`);
  }
};

// Get all messages between two users (sender and receiver)
export const getMessagesBetweenUsers = async (userA, userB) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: userA, receiver: userB },
        { sender: userB, receiver: userA }
      ]
    }).sort({ createdAt: 1 }).populate('sender receiver');
    return messages;
  } catch (error) {
    throw new Error(`Error fetching messages: ${error.message}`);
  }
};

// Get message by ID
export const getMessageById = async (id) => {
  try {
    const message = await Message.findById(id).populate('sender receiver');
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  } catch (error) {
    throw new Error(`Error fetching message: ${error.message}`);
  }
};

// Mark a message as read
export const markMessageAsRead = async (id) => {
  try {
    const message = await Message.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }
    message.read = true;
    const updatedMessage = await message.save();
    return updatedMessage;
  } catch (error) {
    throw new Error(`Error marking message as read: ${error.message}`);
  }
};

export const markMessageAsDelivered = async (id) => {
  try {
    const message = await Message.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }
    message.delivered = true;
    const updatedMessage = await message.save();
    return updatedMessage;
  } catch (error) {
    throw new Error(`Error updating message as delivered: ${error.message}`);
  }
};

// Delete a message by ID
export const deleteMessageById = async (id) => {
  try {
    const result = await Message.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Message not found');
    }
    return result;
  } catch (error) {
    throw new Error(`Error deleting message: ${error.message}`);
  }
};

export const deleteConversationBetweenUsers = async (userA, userB) => {
    try {
      const result = await Message.deleteMany({
        $or: [
          { sender: userA, receiver: userB },
          { sender: userB, receiver: userA }
        ]
      });
      return result;
    } catch (error) {
      throw new Error(`Error deleting conversation: ${error.message}`);
    }
  };
  