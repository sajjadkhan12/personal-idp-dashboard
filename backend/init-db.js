const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('Database initialized successfully!');
    
    // Close the pool
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();

