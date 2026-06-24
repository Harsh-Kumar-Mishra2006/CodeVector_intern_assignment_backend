const mysql = require('mysql2/promise');
const path = require('path');

// Explicitly load .env from the root directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Database Config:');
console.log('  Host:', process.env.DB_HOST || 'NOT SET');
console.log('  Port:', process.env.DB_PORT || 'NOT SET');
console.log('  User:', process.env.DB_USER || 'NOT SET');
console.log('  Database:', process.env.DB_NAME || 'NOT SET');
console.log('  SSL:', process.env.DB_SSL ? 'Enabled' : 'Disabled');

// Parse SSL configuration
let sslConfig = undefined;
if (process.env.DB_SSL === 'true' || process.env.DB_SSL) {
  try {
    if (process.env.DB_SSL.startsWith('{')) {
      sslConfig = JSON.parse(process.env.DB_SSL);
    } else {
      sslConfig = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      };
    }
  } catch (error) {
    console.warn('⚠️ Error parsing DB_SSL, using default SSL config');
    sslConfig = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    };
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'test',
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to TiDB Cloud successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed: ', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    return false;
  }
}

// If this file is run directly (not imported), test the connection
if (require.main === module) {
  console.log('=================================');
  console.log('🔍 Running Database Connection Test');
  console.log('=================================');
  testConnection().then((result) => {
    if (result) {
      console.log('✅ Database is ready!');
    } else {
      console.log('❌ Database connection failed!');
      process.exit(1);
    }
    process.exit(0);
  });
}

module.exports = { pool, testConnection };