const pool = require('./database');

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    
    // Drop all tables
    await pool.query('DROP TABLE IF EXISTS components CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('Database cleared successfully!');
    
    // Recreate tables
    const fs = require('fs');
    const path = require('path');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);
    
    console.log('Database reinitialized successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearDatabase();

