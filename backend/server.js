require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fs = require('fs');
const path = require('path');
const pool = require('./database');

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
