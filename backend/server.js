require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fs = require('fs');
const path = require('path');
const pool = require('./database');

// Set up file logging
const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console methods to log to file
console.log = (...args) => {
  const message = args.join(' ');
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] [LOG] ${message}\n`);
};

console.error = (...args) => {
  const message = args.join(' ');
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] [ERROR] ${message}\n`);
};

console.warn = (...args) => {
  const message = args.join(' ');
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] [WARN] ${message}\n`);
};

const config = require('./config');
const authRoutes = require('./routes/auth');
const componentRoutes = require('./routes/components');
const provisioningRoutes = require('./routes/provisioning');
const destroyRoutes = require('./routes/destroy');
const statusRoutes = require('./routes/status');

const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir);
}

const app = express();
const port = config.PORT || 4000;

// Middleware
app.use(cors({
  origin: config.FRONTEND_ORIGINS,
  credentials: true
}));
app.use(express.json());

app.use(session({
  store: new FileStore({ path: sessionsDir }),
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Test database connection
async function testDatabaseConnection() {
  try {
    // Check if credentials are still placeholders
    if (process.env.DB_USER === 'your-postgres-username' || 
        process.env.DB_PASSWORD === 'your-postgres-password') {
      console.warn('⚠️  WARNING: Database credentials appear to be placeholders.');
      console.warn('   Please update DB_USER and DB_PASSWORD in your .env file.');
      console.warn('   Authentication will fail until database is properly configured.');
      return false;
    }
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    if (error.message && error.message.includes('role') && error.message.includes('does not exist')) {
      console.error('❌ Database connection failed: Invalid database credentials');
      console.error('   Please update DB_USER and DB_PASSWORD in your .env file with your actual PostgreSQL credentials.');
    } else {
      console.error('❌ Database connection failed:', error.message);
      console.error('   Please verify your database is running and credentials are correct.');
    }
    return false;
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    try {
      await pool.query('ALTER TABLE components ADD COLUMN IF NOT EXISTS workspace_name VARCHAR(255)');
    } catch (error) {
      // Column might already exist
    }
    
    try {
      await pool.query('ALTER TABLE components ADD COLUMN IF NOT EXISTS github_repo_owner VARCHAR(255)');
      await pool.query('ALTER TABLE components ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(255)');
    } catch (error) {
      // Columns might already exist
    }
  } catch (error) {
    if (error.code !== '42P07') {
      console.error('Error initializing database:', error.message);
    }
  }
}

// Mount routes
app.use('/', authRoutes);
app.use('/api', componentRoutes);
app.use('/api', provisioningRoutes);
app.use('/api', destroyRoutes);
app.use('/api', statusRoutes);

// Start server
async function startServer() {
  try {
    // Test database connection first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.warn('⚠️  Starting server with database connection issues - some features may not work');
    }
    
    await initializeDatabase();
    
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

module.exports = app;
