const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/Database');
const productRoutes = require('./routes/Products');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'OK',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', productRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'CodeVector Assignment API',
    version: '1.0.0',
    endpoints: {
      products: 'GET /api/products?category=Electronics&cursor=1000&limit=20',
      categories: 'GET /api/categories',
      health: 'GET /health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, async () => {
  console.log(` Server running on http://localhost:${PORT}`);
  await testConnection();
});