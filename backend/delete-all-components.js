const pool = require('./database');

async function deleteAllComponents() {
  try {
    console.log('Deleting all components from database...');
    
    const result = await pool.query('DELETE FROM components');
    console.log(`Deleted ${result.rowCount} components from database`);
    
    console.log('Components cleared successfully!');
  } catch (error) {
    console.error('Error deleting components:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deleteAllComponents();

