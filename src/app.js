const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const expensesRouter = require('./routes/expenses');

const app = express();
app.use(express.json());

// HTTP request logger (skipped in test env to keep test output clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiter: max 10 requests per second per IP (disabled in test env)
const limiter = rateLimit({
  windowMs: 1000,       // 1-second window
  max: 10,              // limit each IP to 10 requests per window
  standardHeaders: true,  // return rate-limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  skip: () => process.env.NODE_ENV === 'test',
});
app.use(limiter);

app.use('/expenses', expensesRouter);

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler (catches malformed JSON bodies, etc.)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
