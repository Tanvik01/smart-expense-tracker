const fs = require('fs');
const path = require('path');

// Allow overriding the data file path (used by tests to avoid touching real data)
const DATA_FILE = process.env.EXPENSES_DATA_FILE
  || path.join(__dirname, 'expenses.json');

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2), 'utf8');
}

module.exports = { readAll, writeAll, DATA_FILE };
