# Product Catalog Backend

A backend service built with Node.js, Express, MySQL and TiDB Cloud that supports browsing a large catalog of products with efficient filtering and cursor-based pagination.

## Overview

This project was developed as part of the CodeVector Internship Take-Home Assignment.

The system generates and stores 200,000 products and provides APIs to:

- Browse products sorted by newest first
- Filter products by category
- Paginate efficiently through large datasets in Batches of 20 Products
- Handle continuously changing data without showing duplicate or missing products

---

## Tech Stack

- Node.js
- Express.js
- TiDB Cloud (MySQL Compatible)
- Faker.js
- MySQL2

---

## Database Schema

### Products Table

| Column     | Type                                                            |
| ---------- | --------------------------------------------------------------- |
| id         | INT AUTO_INCREMENT PRIMARY KEY                                  |
| name       | VARCHAR(255) NOT NULL                                           |
| category   | VARCHAR(100) NOT NULL                                           |
| price      | DECIMAL(10, 2) NOT NULL                                         |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP                             |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

---

## Database Indexes

```sql
INDEX idx_category (category),
INDEX idx_created_at (created_at)
```

These indexes help optimize sorting and cursor-based pagination queries.

---

## Data Generation

A seed script generates 200,000 fake products using Faker.js.

Generated fields:

- Product Name
- Category
- Price
- Created Timestamp
- Updated Timestamp

Data is inserted in batches to improve performance and reduce database round trips.

### Run Seed Script

```bash
npm seed.js
```

---

## API Endpoints

### Get Products

```bash
GET /api/products
```

### Query Parameters

| Parameter         | Type     | Required | Description                   | Default |
| ----------------- | -------- | -------- | ----------------------------- | ------- |
| `category`        | string   | ❌       | Filter products by category   | None    |
| `limit`           | integer  | ❌       | Number of products per page   | 20      |
| `cursorCreatedAt` | datetime | ❌       | ISO timestamp of last product | None    |
| `cursorId`        | integer  | ❌       | ID of last product            | None    |

### Examples

#### First Page

```bash
GET /api/products?limit=20
```

#### Next Page

```bash
GET /api/products?limit=20&cursorCreatedAt=2026-06-23T14:00:00.000Z&cursorId=131
```

#### Filter by Category

```bash
GET /api/products?category=Electronics&limit=10
```

#### Category + Pagination

```bash
GET /api/products?category=Electronics&cursorCreatedAt=2026-06-23T14:00:00.000Z&cursorId=131&limit=20
```

---

## Response Format

#### Success(200 OK)

```json
{
  "products": [
    {
      "id": 186751,
      "name": "Intelligent Granite Keyboard",
      "category": "Toys",
      "price": 4857.95,
      "created_at": "2026-06-24T09:00:00.000Z",
      "updated_at": "2026-06-24T09:00:00.000Z"
    }
  ]
}
```

#### Error(500 Server Error)

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

### Get Products

```bash
GET /categories
```

## Querry Parameters

None

## Example Request

```bash
GET /api/categories
```

### Response

## Success(200 OK)

```json
{
  "success": true,
  "data": [
    "Automotive",
    "Books",
    "Clothing",
    "Electronics",
    "Garden",
    "Home",
    "Sports",
    "Toys"
  ],
  "count": 8
}
```

---

## Key Design Decisions

### Why Not Offset Pagination?

Offset pagination:

```sql
SELECT *
FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 10000;
```

Problems:

- Performance degrades as offset grows
- Database scans and skips rows internally
- Can return duplicate records
- Can miss records when new products are inserted while browsing

---

## Cursor-Based Pagination (using created_at + id)

The last record from the current page becomes the cursor for the next page.

```sql
SELECT * FROM products
WHERE (
  created_at < ?
  OR (created_at = ? AND id < ?)
)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

Benefits:

- Always starts from the last seen product
- Handles ties with id as tie-breaker
- No duplicates or missed records when data changes

---

## Batch Insert for Seeding

- 10,000 records per batch
- Prevents timeout and memory issues
- Handles 200,000 records in ~30 seconds

---

## Local Setup

### Clone Repository

```bash
git clone <https://github.com/Harsh-Kumar-Mishra2006/CodeVector_intern_assignment_backend>
cd CodeVector_Internship_Assignment
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

Create a `.env` file:

```env
PORT=3000

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SSL=
```

### Run Application

```bash
npm start
```

---

## Project Structure

```text
project/
│
├── config/
│   └── Database.js
│
├── routes/
│   └── Products.js
│
├── scripts/
│   └── seed.js
│
├── .env
├── app.js
└── package.json
```

---

## Future Improvements

For Future improvement purpose, I would add:

- Full-text search optimization for product names
- Rate Limiting

---

## AI Usage

AI tools were used for:

- Getting help to add fake data via Faker
- Working with seed.js file for generating products
- Reviewing pagination approaches
- Discussing database indexing strategies
- Validating cursor pagination logic
- Fixing Database Configuration issue
- Improving documentation

---
