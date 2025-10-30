const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('../config');
const { users: userDb } = require('../db-helpers');
const { requireAuth } = require('../middleware/auth');

// Get access token from GitHub
async function getAccessToken({ code, client_id, client_secret }) {
  try {
    const params = `?client_id=${client_id}&client_secret=${client_secret}&code=${code}`;
    const response = await axios.post(
      `https://github.com/login/oauth/access_token${params}`,
      {},
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    
    if (!response.data.access_token) {
      console.error('No access token received:', response.data);
      throw new Error('Failed to get access token from GitHub');
    }
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

// Get GitHub user info
async function getGithubUser(access_token) {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting GitHub user:', error.response?.data || error.message);
    throw error;
  }
}

// GitHub OAuth initiation
router.get('/login/github', (req, res) => {
  const redirect_uri = 'http://localhost:4000/login/github/callback';
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&redirect_uri=${redirect_uri}`
  );
});

// GitHub OAuth callback
router.get('/login/github/callback', async (req, res) => {
  try {
    const code = req.query.code;
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }
    
    const access_token = await getAccessToken({
      code,
      client_id: config.GITHUB_CLIENT_ID,
      client_secret: config.GITHUB_CLIENT_SECRET,
    });
    
    const githubUser = await getGithubUser(access_token);
    const userWithToken = { ...githubUser, access_token };
    
    let user = await userDb.create(userWithToken);
    req.session.userId = user.id;

    res.redirect('http://localhost:3000/dashboard?tab=dashboard');
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error);
    
    // Provide more specific error messages
    if (error.message && error.message.includes('role') && error.message.includes('does not exist')) {
      console.error('Database connection error: Invalid database credentials');
      return res.status(500).send(`
        <html>
          <body>
            <h1>Database Configuration Error</h1>
            <p>Authentication failed due to database connection issues.</p>
            <p>Please update your database credentials in the <code>.env</code> file:</p>
            <ul>
              <li><code>DB_USER</code> - Your PostgreSQL username (not "your-postgres-username")</li>
              <li><code>DB_PASSWORD</code> - Your PostgreSQL password (not "your-postgres-password")</li>
            </ul>
            <p>After updating, restart the server and try again.</p>
            <p><a href="/login/github">Try again</a></p>
          </body>
        </html>
      `);
    }
    
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// Get current user info
router.get('/api/me', requireAuth, async (req, res) => {
  try {
  const user = await userDb.findById(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { access_token, accessToken, ...userWithoutToken } = user;
  res.json({ ...userWithoutToken, role: 'admin' });
  } catch (error) {
    console.error('Error in /api/me:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

// Logout
router.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out' });
  });
});

module.exports = router;

