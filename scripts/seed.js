const { pool } = require('../config/Database');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const categories = ['Electronics', 'Clothing', 'Books', 'Bag', 'Home', 'Toys', 'Sports', 'Automotive', 'Garden'];

// Create table function
async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Table created successfully');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  }
}

// Generate product function
function generateProduct() {
  const createdAt = faker.date.past({ years: 1 });
  const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

  return {
    name: faker.commerce.productName(),
    category: faker.helpers.arrayElement(categories),
    price: Number(faker.commerce.price({ min: 50, max: 10000, dec: 2 })),
    created_at: createdAt,
    updated_at: updatedAt
  };
}

// Generate product batch function - FIXED
function generateProductBatch(batchSize) {
  const products = [];
  for (let i = 0; i < batchSize; i++) {
    const product = generateProduct();
    products.push([
      product.name,
      product.category,
      product.price,
      product.created_at,
      product.updated_at
    ]);
  }
  return products;
}

// Main seed function
async function seed() {
  try {
    console.log('🚀 Starting database seeding...');
    
    await createTable();

    // Checking existing count
    const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const currentCount = countResult[0].total;
    
    // If more than 200000 products are present then exit
    if (currentCount >= 200000) {
      console.log(`✅ Table already has ${currentCount.toLocaleString()} products`);
      process.exit(0);
    }

    // If there are some products but less than 200k, ask user
    if (currentCount > 0) {
      console.log(`⚠️  Found ${currentCount.toLocaleString()} existing products.`);
      console.log('🔄 Truncating table to start fresh...');
    }

    // Clearing existing data
    await pool.query('TRUNCATE TABLE products');
    console.log('✅ Cleared existing products');

    const total = 200000;
    const batchSize = 10000;
    let insertedCount = 0;

    console.log(`📊 Seeding ${total.toLocaleString()} products in batches of ${batchSize.toLocaleString()}...`);

    for (let i = 0; i < total; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, total - i);
      
      console.log(`  📦 Inserting batch ${Math.floor(i/batchSize) + 1} (${currentBatchSize.toLocaleString()} products)...`);
      
      const values = generateProductBatch(currentBatchSize);
      
      // Inserting batch
      await pool.query(
        `INSERT INTO products (name, category, price, created_at, updated_at) VALUES ?`,
        [values]
      );
      
      insertedCount += currentBatchSize;
      console.log(`  ✅ Batch ${Math.floor(i/batchSize) + 1} complete (${insertedCount.toLocaleString()} total)`);
    }

    // Verification
    const [result] = await pool.query('SELECT COUNT(*) AS total FROM products');
    console.log(`✅ Seeded ${result[0].total.toLocaleString()} products successfully!`);

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run seed
seed();