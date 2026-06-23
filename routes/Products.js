const express = require('express');
const router = express.Router();
const { pool } = require('../config/Database');

// GET Products
router.get('/products', async (req, res) => {
  try {
    const { 
      category, 
      limit = 20,
      cursorCreatedAt,
      cursorId 
    } = req.query;
    
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);

    let conditions = [];
    let params = [];

    // Category Filter
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    // Cursor Pagination (Using created_at + id)
    if (cursorCreatedAt && cursorId) {
      conditions.push(`
        (
          created_at < ?
          OR (
            created_at = ?
            AND id < ?
          )
        )
      `);
      params.push(cursorCreatedAt, cursorCreatedAt, cursorId);
    }

    //Where clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT *
      FROM products
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `;
    params.push(parsedLimit);

    const [rows] = await pool.query(query, params);

    // Checking if there are more products
    const items = rows;
    const hasMore = items.length === parsedLimit;

    // Get the last product for cursor
    const lastProduct = items.length > 0 ? items[items.length - 1] : null;

    res.json({
      success: true,
      data: items,
      pagination: {
        next_cursor: lastProduct ? {
          created_at: lastProduct.created_at,
          id: lastProduct.id
        } : null,
        has_more: hasMore,
        limit: parsedLimit,
        returned_count: items.length
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET Categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );

    res.set('Cache-Control', 'public, max-age=3600'); 

    res.json({
      success: true,
      data: rows.map(row => row.category),
      count: rows.length
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;