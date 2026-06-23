# Product Catalog Backend

A backend service built with Node.js, Express, and TiDB Cloud that supports browsing a large catalog of products with efficient filtering and cursor-based pagination.

## Overview

This project was developed as part of the CodeVector Internship Take-Home Assignment.

The system generates and stores 200,000 products and provides APIs to:

- Browse products sorted by newest first
- Filter products by category
- Paginate efficiently through large datasets
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

| Column     | Type                                  |
| ---------- | ------------------------------------- |
| id         | BIGINT/INT AUTO_INCREMENT PRIMARY KEY |
| name       | VARCHAR(255)                          |
| category   | VARCHAR(100)                          |
| price      | DECIMAL(10,2)                         |
| created_at | TIMESTAMP                             |
| updated_at | TIMESTAMP                             |

---

## Database Indexes

```sql
CREATE INDEX idx_created_id
ON products(created_at DESC, id DESC);

CREATE INDEX idx_category_created_id
ON products(category, created_at DESC, id DESC);
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
npm run seed
```

---

## API Endpoints

### Get Products

```http
GET /api/products
```

### Query Parameters

| Parameter       | Description                 |
| --------------- | --------------------------- |
| limit           | Number of products per page |
| category        | Filter by category          |
| cursorCreatedAt | Cursor timestamp            |
| cursorId        | Cursor product ID           |

### Examples

#### First Page

```http
GET /api/products?limit=20
```

#### Filter by Category

```http
GET /api/products?category=Electronics&limit=20
```

#### Next Page

```http
GET /api/products?limit=20&cursorCreatedAt=2026-06-23T10:15:30.000Z&cursorId=5432
```

---

## Response Format

```json
{
  "products": [
    {
      "id": 123,
      "name": "Ergonomic Steel Keyboard",
      "category": "Electronics",
      "price": 2999,
      "created_at": "2026-06-23T10:20:00.000Z",
      "updated_at": "2026-06-23T10:20:00.000Z"
    }
  ],
  "nextCursor": {
    "created_at": "2026-06-23T10:15:30.000Z",
    "id": 5432
  }
}
```

---

## Pagination Strategy

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

## Cursor-Based Pagination

Products are sorted by:

```sql
ORDER BY created_at DESC, id DESC
```

The last record from the current page becomes the cursor for the next page.

Example query:

```sql
SELECT *
FROM products
WHERE (
    created_at < ?
    OR (
        created_at = ?
        AND id < ?
    )
)
ORDER BY created_at DESC, id DESC
LIMIT ?;
```

Benefits:

- Consistent pagination
- No duplicate records
- No skipped records
- Better performance on large datasets
- Works correctly when data changes during browsing

---

## Handling Data Changes

One requirement of the assignment was:

> If new products are added or updated while a user is browsing, they must not see duplicate products or miss products.

This is achieved through cursor-based pagination.

Since each page starts after the last product already seen by the user:

- Newly inserted products appear before the current cursor
- Previously viewed products are not shown again
- Existing products are not skipped
- Pagination remains stable even when data changes

---

## Local Setup

### Clone Repository

```bash
git clone <repository-url>
cd product-catalog-backend
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

Create a `.env` file:

```env
PORT=5000

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

### Run Application

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Seed Database

```bash
npm run seed
```

---

## Project Structure

```text
project/
│
├── config/
│   └── database.js
│
├── routes/
│   └── productRoutes.js
│
├── controllers/
│   └── productController.js
│
├── scripts/
│   └── seedProducts.js
│
├── middleware/
│
├── .env
├── package.json
└── server.js
```

---

## Future Improvements

Given additional time, I would add:

- Request validation using Joi/Zod
- Swagger/OpenAPI documentation
- Automated testing (Jest)
- Docker support
- Redis caching
- Rate limiting
- Monitoring and logging

---

## AI Usage

AI tools were used for:

- Reviewing pagination approaches
- Discussing database indexing strategies
- Validating cursor pagination logic
- Improving documentation

All implementation decisions, testing, debugging, and final verification were performed manually.
