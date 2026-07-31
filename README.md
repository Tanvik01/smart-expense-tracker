# Smart Expense Tracker API

A REST API for managing personal expenses — add, list, filter by category,
compute totals (overall and by category), get a monthly summary, delete, and search by title.
Built with Node.js and Express, storing data in a local JSON file.

## Project Structure

```
smart-expense-tracker/
├── src/
│   ├── app.js               # Express app setup & middleware
│   ├── server.js            # Entry point — starts the HTTP server
│   ├── data/
│   │   ├── expenses.json    # Persistent data store (auto-created)
│   │   └── store.js         # JSON read/write helpers
│   ├── models/
│   │   ├── categories.js    # Fixed category list
│   │   └── validate.js      # Input validation logic
│   └── routes/
│       └── expenses.js      # All /expenses route handlers
├── tests/
│   └── expenses.test.js     # Jest integration tests
├── .gitignore
├── AI_NOTES.md              # AI-assisted development notes
├── package.json
├── package-lock.json
└── README.md
```

## Install

```
npm install
```

## Run the server

```
npm start
```

The server starts on `http://localhost:3000`.

## Run the tests

```
npm test
```

Tests use a separate JSON file (`tests/test-expenses.json`) so they never
touch the real data in `src/data/expenses.json`.

## API

| Method | Route | Description |
|---|---|---|
| POST | `/expenses` | Add an expense |
| GET | `/expenses` | List all expenses |
| GET | `/expenses?category=Food` | Filter by category |
| GET | `/expenses?q=coffee` | Search by title (bonus) |
| GET | `/expenses/total` | Overall total + total by category |
| GET | `/expenses/summary/monthly?year=YYYY&month=MM` | Monthly summary: total, count, breakdown by category, and expense list |
| GET | `/expenses/:id` | Get one expense |
| DELETE | `/expenses/:id` | Delete an expense |

### Expense object

```json
{
  "id": "auto-generated",
  "title": "Coffee",
  "amount": 4.5,
  "category": "Food",
  "date": "2026-07-30"
}
```

**Categories (fixed set):** `Food, Travel, Bills, Shopping, Entertainment, Health, Other`

### Validation rules

- `title`: required, non-empty, max 100 characters
- `amount`: required, number, must be greater than 0, max 2 decimal places
- `category`: required, must be one of the fixed set above
- `date`: required, must be `YYYY-MM-DD`

Invalid input returns `400` with an `errors` array. Deleting or fetching a
non-existent id returns `404`. Filtering by a valid category with no matches
returns `200` with an empty list.

## Example requests

```
curl -X POST localhost:3000/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","amount":52.30,"category":"Food","date":"2026-07-31"}'

curl localhost:3000/expenses

curl localhost:3000/expenses?category=Food

curl localhost:3000/expenses/total

curl 'localhost:3000/expenses/summary/monthly?year=2026&month=7'

curl -X DELETE localhost:3000/expenses/<id>
```
