import express from 'express';
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByProjectId,
  modifyExpense,
  deleteExpenseById,
} from '../Controller/ExpenseC.js';

const router = express.Router();

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await getAllExpenses();
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const expenses = await getExpensesByProjectId(projectId);
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Failed to fetch expenses by projectId:', error);
    res.status(500).json({ error: 'Failed to fetch expenses for project' });
  }
});
// GET a single expense by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await getExpenseById(id);
    res.status(200).json(expense);
  } catch (error) {
    res.status(404).json({ message: 'Expense not found', error: error.message });
  }
});

// POST a new expense
router.post('/', async (req, res) => {
  const payload = req.body;
  try {
    const expense = await createExpense(payload);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
});

// PUT to update an existing expense
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    const expense = await modifyExpense(id, payload);
    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
});

// DELETE an expense by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await deleteExpenseById(id);
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
});

export default router;
