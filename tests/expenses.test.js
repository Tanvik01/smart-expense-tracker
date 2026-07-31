const fs = require('fs');
const path = require('path');

// Use a separate data file for tests so we never touch real data
const TEST_DATA_FILE = path.join(__dirname, 'test-expenses.json');
process.env.EXPENSES_DATA_FILE = TEST_DATA_FILE;

const request = require('supertest');
const app = require('../src/app');

beforeEach(() => {
  fs.writeFileSync(TEST_DATA_FILE, '[]', 'utf8');
});

afterAll(() => {
  if (fs.existsSync(TEST_DATA_FILE)) fs.unlinkSync(TEST_DATA_FILE);
});

const validExpense = {
  title: 'Coffee',
  amount: 45,
  category: 'Food',
  date: '2026-07-30',
};

//TEST TO CREATE AN EXPENSE
describe('POST /expenses', () => {
  test('creates an expense with valid input', async () => {
    const res = await request(app).post('/expenses').send(validExpense);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(validExpense);
    expect(res.body.id).toBeDefined();
  });

  test('rejects missing title', async () => {
    const { title, ...rest } = validExpense;
    const res = await request(app).post('/expenses').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.errors.join(' ')).toMatch(/title/i);
  });

  test('rejects zero or negative amount', async () => {
    const res = await request(app).post('/expenses').send({ ...validExpense, amount: -5 });
    expect(res.status).toBe(400);
    expect(res.body.errors.join(' ')).toMatch(/amount/i);
  });

  test('rejects amount with more than 2 decimal places', async () => {
    const res = await request(app).post('/expenses').send({ ...validExpense, amount: 4.567 });
    expect(res.status).toBe(400);
  });

  test('rejects category outside the fixed set', async () => {
    const res = await request(app).post('/expenses').send({ ...validExpense, category: 'Rent' });
    expect(res.status).toBe(400);
    expect(res.body.errors.join(' ')).toMatch(/category/i);
  });

  test('rejects invalid date format', async () => {
    const res = await request(app).post('/expenses').send({ ...validExpense, date: '30-07-2026' });
    expect(res.status).toBe(400);
  });
});

//TEST TO LIST ALL EXPENSES
describe('GET /expenses', () => {
  test('returns empty list when no expenses exist', async () => {
    const res = await request(app).get('/expenses');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all created expenses', async () => {
    await request(app).post('/expenses').send(validExpense);
    await request(app).post('/expenses').send({ ...validExpense, title: 'Bus ticket', category: 'Travel', amount: 20 });

    const res = await request(app).get('/expenses');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('filters by category', async () => {
    await request(app).post('/expenses').send(validExpense);
    await request(app).post('/expenses').send({ ...validExpense, title: 'Bus ticket', category: 'Travel', amount: 20 });

    const res = await request(app).get('/expenses?category=Travel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].category).toBe('Travel');
  });

  test('returns empty list for a valid category with no matches', async () => {
    await request(app).post('/expenses').send(validExpense);
    const res = await request(app).get('/expenses?category=Health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('rejects filtering by an invalid category', async () => {
    const res = await request(app).get('/expenses?category=NotACategory');
    expect(res.status).toBe(400);
  });

  test('bonus: searches by title substring, case-insensitive', async () => {
    await request(app).post('/expenses').send(validExpense); // "Coffee"
    await request(app).post('/expenses').send({ ...validExpense, title: 'Bus ticket', category: 'Travel' });

    const res = await request(app).get('/expenses?q=coff');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Coffee');
  });
});
//OVERALL TOTAL AND breakdown BY CATEGORY TEST
describe('GET /expenses/total', () => {
  test('computes overall and per-category totals', async () => {
    await request(app).post('/expenses').send({ ...validExpense, amount: 10 });
    await request(app).post('/expenses').send({ ...validExpense, amount: 5 });
    await request(app).post('/expenses').send({ ...validExpense, category: 'Travel', amount: 20 });

    const res = await request(app).get('/expenses/total');
    expect(res.status).toBe(200);
    expect(res.body.overall).toBe(35);
    expect(res.body.byCategory.Food).toBe(15);
    expect(res.body.byCategory.Travel).toBe(20);
    expect(res.body.byCategory.Bills).toBe(0);
  });

  test('returns zero totals when no expenses exist', async () => {
    const res = await request(app).get('/expenses/total');
    expect(res.status).toBe(200);
    expect(res.body.overall).toBe(0);
  });
});
// TEST TO DELETE AN EXPENSE
describe('DELETE /expenses/:id', () => {
  test('deletes an existing expense', async () => {
    const created = await request(app).post('/expenses').send(validExpense);
    const id = created.body.id;

    const res = await request(app).delete(`/expenses/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);

    const listRes = await request(app).get('/expenses');
    expect(listRes.body).toHaveLength(0);
  });

  test('returns 404 when deleting a non-existent id', async () => {
    const res = await request(app).delete('/expenses/does-not-exist');
    expect(res.status).toBe(404);
  });
});

//TEST TO GET A PARTICULAR EXPENSE
describe('GET /expenses/:id', () => {
  test('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/expenses/does-not-exist');
    expect(res.status).toBe(404);
  });
});

//BONUS FEATURE: MONTHLY SUMMARY TEST
describe('GET /expenses/summary/monthly', () => {
  test('returns 400 when year or month is missing', async () => {
    const noYear = await request(app).get('/expenses/summary/monthly?month=7');
    expect(noYear.status).toBe(400);
    expect(noYear.body.error).toMatch(/year/i);

    const noMonth = await request(app).get('/expenses/summary/monthly?year=2026');
    expect(noMonth.status).toBe(400);
    expect(noMonth.body.error).toMatch(/month/i);
  });

  test('returns 400 for an invalid month value', async () => {
    const res = await request(app).get('/expenses/summary/monthly?year=2026&month=13');
    expect(res.status).toBe(400);
  });

  test('returns summary with correct totals and category breakdown', async () => {
    // Two July expenses, one August expense
    await request(app).post('/expenses').send({ ...validExpense, amount: 30, date: '2026-07-10' });
    await request(app).post('/expenses').send({ ...validExpense, amount: 20, category: 'Travel', date: '2026-07-20' });
    await request(app).post('/expenses').send({ ...validExpense, amount: 99, date: '2026-08-01' });

    const res = await request(app).get('/expenses/summary/monthly?year=2026&month=7');
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2026);
    expect(res.body.month).toBe(7);
    expect(res.body.count).toBe(2);
    expect(res.body.total).toBe(50);
    expect(res.body.byCategory.Food).toBe(30);
    expect(res.body.byCategory.Travel).toBe(20);
    expect(res.body.byCategory.Bills).toBe(0);
    expect(res.body.expenses).toHaveLength(2);
  });

  test('excludes expenses from other months', async () => {
    await request(app).post('/expenses').send({ ...validExpense, amount: 10, date: '2026-06-15' });
    await request(app).post('/expenses').send({ ...validExpense, amount: 10, date: '2026-08-01' });

    const res = await request(app).get('/expenses/summary/monthly?year=2026&month=7');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.total).toBe(0);
    expect(res.body.expenses).toEqual([]);
  });

  test('returns zero totals when no expenses exist for the month', async () => {
    const res = await request(app).get('/expenses/summary/monthly?year=2026&month=7');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.total).toBe(0);
  });
});
