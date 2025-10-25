const pool = require('./database');

// Helper function to convert snake_case to camelCase
function toCamelCase(row) {
  if (!row) return null;
  const camelRow = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    camelRow[camelKey] = value;
  }
  return camelRow;
}

// User operations
const users = {
  async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return toCamelCase(result.rows[0]);
  },

  async findByLogin(login) {
    const result = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    return toCamelCase(result.rows[0]);
  },

  async create(user) {
    const { id, login, name, email, avatar_url, access_token } = user;
    const result = await pool.query(
      `INSERT INTO users (id, login, name, email, avatar_url, access_token, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         login = EXCLUDED.login,
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         avatar_url = EXCLUDED.avatar_url,
         access_token = EXCLUDED.access_token,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, login, name, email, avatar_url, access_token]
    );
    return toCamelCase(result.rows[0]);
  },

  async update(id, updates) {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    const result = await pool.query(
      `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    return toCamelCase(result.rows[0]);
  }
};

// Component operations
const components = {
  async findAll() {
    const result = await pool.query('SELECT * FROM components ORDER BY created_at DESC');
    return result.rows.map(toCamelCase);
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM components WHERE id = $1', [id]);
    return toCamelCase(result.rows[0]);
  },

  async create(component) {
    const {
      id, name, description, owner, type, lifecycle, githubUrl,
      terraformRunId, terraformStatus, terraformError, isDestroying
    } = component;
    
    const result = await pool.query(
      `INSERT INTO components (
        id, name, description, owner, type, lifecycle, github_url,
        terraform_run_id, terraform_status, terraform_error, is_destroying,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [id, name, description, owner, type, lifecycle, githubUrl,
       terraformRunId, terraformStatus, terraformError, isDestroying]
    );
    return toCamelCase(result.rows[0]);
  },

  async update(id, updates) {
    const setClauses = [];
    const values = [id];
    let paramIndex = 2;
    
    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case for database columns
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      setClauses.push(`${dbKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    
    const result = await pool.query(
      `UPDATE components SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return toCamelCase(result.rows[0]);
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM components WHERE id = $1 RETURNING *', [id]);
    return toCamelCase(result.rows[0]);
  }
};

module.exports = {
  users,
  components
};
