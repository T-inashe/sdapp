import Expense from '../Models/Expense.js';

// Create an expense
export const createExpense = async (payload) => {
  try {
    const newExpense = new Expense(payload);
    const savedExpense = await newExpense.save();
    return savedExpense;
  } catch (error) {
    throw new Error(`Error creating expense: ${error.message}`);
  }
};

// Get all expenses
export const getAllExpenses = async () => {
  try {
    const expenses = await Expense.find();
    return expenses;
  } catch (error) {
    throw new Error(`Error fetching expenses: ${error.message}`);
  }
};

// Get a single expense by ID
export const getExpenseById = async (id) => {
  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    return expense;
  } catch (error) {
    throw new Error(`Error fetching expense: ${error.message}`);
  }
};


export const getExpensesByProjectId = async (projectId) => {
  try {
    const expenses = await Expense.find({ projectId: projectId });
    return expenses;
  } catch (error) {
    throw new Error(`Error fetching expenses for project: ${error.message}`);
  }
};


// Modify an expense
export const modifyExpense = async (id, payload) => {
  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }

    Object.keys(payload).forEach((key) => {
      expense[key] = payload[key];
    });

    const updatedExpense = await expense.save();
    return updatedExpense;
  } catch (error) {
    throw new Error(`Error updating expense: ${error.message}`);
  }
};

// Delete an expense
export const deleteExpenseById = async (id) => {
  try {
    const result = await Expense.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Expense not found');
    }
    return result;
  } catch (error) {
    throw new Error(`Error deleting expense: ${error.message}`);
  }
};
