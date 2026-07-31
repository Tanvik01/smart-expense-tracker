const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readAll, writeAll } = require('../data/store');
const { validateExpenseInput } = require('../models/validate');
const { CATEGORIES } = require('../models/categories');

const router = express.Router();

// GET /expenses?category=Food&q=coffee
// - category filters to an exact fixed-set match
// - q is an optional bonus search on the title (case-insensitive substring)
router.get('/', (req, res) => {
  const { category, q } = req.query;
  let expenses = readAll();

  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `category must be one of: ${CATEGORIES.join(', ')}`,
      });
    }
    expenses = expenses.filter((e) => e.category === category);
  }

  if (q !== undefined) {
    const needle = String(q).trim().toLowerCase();
    expenses = expenses.filter((e) => e.title.toLowerCase().includes(needle));
  }

  res.status(200).json(expenses);
});

// GET /expenses/total  -> overall total + breakdown by category
router.get('/total', (req, res) => {
  const expenses = readAll();
  const overall = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = {};
  for (const cat of CATEGORIES) byCategory[cat] = 0;
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  res.status(200).json({
    overall: Math.round(overall * 100) / 100,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
  });
});

// BONUS FEATURE: MONTHLY SUMMARY REPORT
// Must be registered before /:id so Express doesn't match 'summary' as a dynamic id
router.get('/summary/monthly', (req, res) => {
  const { year, month } = req.query;

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);

  if (!year || !month || isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    return res.status(400).json({
      error: 'Query params "year" (e.g. 2026) and "month" (1-12) are required and must be valid integers.',
    });
  }

  const all = readAll();

  // Filter expenses whose date falls within the requested year-month
  const monthlyExpenses = all.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === y && d.getMonth() + 1 === m;
  });

  const total = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = {};
  for (const cat of CATEGORIES) byCategory[cat] = 0;
  for (const e of monthlyExpenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  res.status(200).json({
    year: y,
    month: m,
    count: monthlyExpenses.length,
    total: Math.round(total * 100) / 100,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    expenses: monthlyExpenses,
  });
});

// GET /expenses/:id
router.get('/:id', (req, res) => {
  const expenses = readAll();
  const expense = expenses.find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ error: `No expense found with id ${req.params.id}` });
  }
  res.status(200).json(expense);
});

// POST /expenses
router.post('/', (req, res) => {
  const { valid, errors } = validateExpenseInput(req.body);
  if (!valid) {
    return res.status(400).json({ errors });
  }

  const expense = {
    id: uuidv4(),
    title: req.body.title.trim(),
    amount: req.body.amount,
    category: req.body.category,
    date: req.body.date,
  };

  const expenses = readAll();
  expenses.push(expense);
  writeAll(expenses);

  res.status(201).json(expense);
});

// DELETE /expenses/:id
router.delete('/:id', (req, res) => {
  const expenses = readAll();
  const index = expenses.findIndex((e) => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: `No expense found with id ${req.params.id}` });
  }

  const [deleted] = expenses.splice(index, 1);
  writeAll(expenses);

  res.status(200).json(deleted);
});

module.exports = router;
