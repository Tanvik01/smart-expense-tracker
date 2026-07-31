# AI Notes

## 1. What was AI-generated vs. written by me

**AI-generated (Claude), starting from decisions I made first:**
- Project scaffold (`src/app.js`, `src/server.js`, folder structure)
- CRUD route implementations in `src/routes/expenses.js`
- Validation logic in `src/models/validate.js`
- Test suite in `tests/expenses.test.js`

**Decisions I made before generating any code**:
- Chose a fixed category set instead of free text, because free text would
  fragment the "total by category" feature (e.g. "food" vs "Food" vs
  "groceries" counted separately).
- Chose strict validation over lenient coercion (e.g. reject `"50"` as a
  string instead of silently converting it) for data integrity.
- Decided error-handling behavior: 400 for invalid input, 404 for
  not-found, 200 + empty list for a valid filter with no matches.

**Written/edited directly by me (not AI-generated):**
-  POST request('/expenses') added the '/expenses' parameter to the post request.
- Added UUID instead of Auto-increment IDs for each expense.
- Added a bonus feature of '/expenses/summary/monthly' to get a summary of expenses for a particular month.
- Added fs module to update data in the JSON file for persistence 
- (EXTRA FEATURE) Added Morgan Middleware to request logger to be able to see the requests and their responses in the console.
- (EXTRA FEATURE) Added Express Rate Limiter to limit the number of requests to the API 10 per second.
- Wrote the git route on my own.

## 2. What I validated, tested, or changed, and why

- I read through every route before moving on and found that POST route was just ('/') which is very vulnerable to brute force attacks so i changed it to ('/expenses') and also to follow the naming convention.
- Ran the tests myself deliberately breaking the code to confirm the tests flag it. For instance by commenting out the amount <=0 check and testing it again.
- Changed auto-incremental IDs to UUIDs for better scalability as it can be generated client-side.
## 3. AI suggestions I decided not to use, and why
- Claude mentioned coercion ("50" → 50) as an option for the amount ,the current code rejects it because of data integrity.
- Claude suggested to use Mocha + Chai + Supertest as the testing suite for the current environment while for the current code Jest + supertest is a better choice as it lets you send HTTP requests directly to your Express app in-process, no need to actually start a server on a port.

