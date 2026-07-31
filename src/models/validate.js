const { CATEGORIES } = require('./categories');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

// Returns { valid: true } or { valid: false, errors: [...] }
function validateExpenseInput(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const { title, amount, category, date } = body;

  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title is required and must be a non-empty string');
  } else if (title.trim().length > 100) {
    errors.push('title must be 100 characters or fewer');
  }

  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    errors.push('amount is required and must be a number');
  } else if (amount <= 0) {
    errors.push('amount must be greater than 0');
  } else if (Math.round(amount * 100) !== amount * 100) {
    errors.push('amount must have at most 2 decimal places');
  }

  if (typeof category !== 'string' || !CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }

  if (typeof date !== 'string' || !isValidDate(date)) {
    errors.push('date is required and must be a valid date in YYYY-MM-DD format');
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

module.exports = { validateExpenseInput, isValidDate };
