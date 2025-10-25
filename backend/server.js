require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fs = require('fs');
const path = require('path');
const pool = require('./database');
const { users: userDb, components: componentDb } = require('./db-helpers');

const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir);
}

const app = express();
const port = 4000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Support both Vite and Next.js
  credentials: true
}));
app.use(express.json());

app.use(session({
  store: new FileStore({ path: sessionsDir }),
  secret: 'keyboard cat', // a secret string used to sign the session ID cookie
  resave: false,
  saveUninitialized: false,
}));

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Terraform Cloud Configuration
const TERRAFORM_CLOUD_API_TOKEN = process.env.TERRAFORM_CLOUD_API_TOKEN;
const TERRAFORM_CLOUD_ORG_NAME = process.env.TERRAFORM_CLOUD_ORG_NAME;
const TERRAFORM_CLOUD_WORKSPACE_NAME = process.env.TERRAFORM_CLOUD_WORKSPACE_NAME;
const TERRAFORM_CLOUD_API_URL = 'https://app.terraform.io/api/v2';

// Middleware to check if the user's token is still valid
const validateToken = async (req, res, next) => {
  if (!req.session.userId) {
    return next();
  }

  const user = await userDb.findById(req.session.userId);
  if (!user || !user.access_token) {
    return next();
  }

  try {
    await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
    });
    next();
  } catch (error) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to log out' });
      }
      res.clearCookie('connect.sid');
      return res.status(401).json({ error: 'GitHub token is no longer valid.' });
    });
  }
};


app.get('/login/github', (req, res) => {
  const redirect_uri = 'http://localhost:4000/login/github/callback';
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirect_uri}`
  );
});

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

app.get('/login/github/callback', async (req, res) => {
  try {
    const code = req.query.code;
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }
    
    const access_token = await getAccessToken({
      code,
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
    });
    
    const githubUser = await getGithubUser(access_token);

    // Add the access_token to the user object
    const userWithToken = { ...githubUser, access_token };

    // Find or create a user in our database
    let user = await userDb.create(userWithToken);

    // Create a session for the user
    req.session.userId = user.id;

    res.redirect('http://localhost:3000');
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});
app.get('/api/me', validateToken, async (req, res) => {
  if (req.session.userId) {
    const user = await userDb.findById(req.session.userId);
    if (user) {
      // Don't send the access token to the client
      const { access_token, ...userWithoutToken } = user;
      res.json({ ...userWithoutToken, role: 'admin' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out' });
  });
});

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Terraform Cloud helper functions
async function triggerTerraformRun(variables) {
  if (!TERRAFORM_CLOUD_API_TOKEN || !TERRAFORM_CLOUD_ORG_NAME || !TERRAFORM_CLOUD_WORKSPACE_NAME) {
    throw new Error('Terraform Cloud configuration is missing. Please set TERRAFORM_CLOUD_API_TOKEN, TERRAFORM_CLOUD_ORG_NAME, and TERRAFORM_CLOUD_WORKSPACE_NAME environment variables.');
  }

  // Get workspace ID - using single workspace for all buckets
  const workspaceUrl = `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces/${TERRAFORM_CLOUD_WORKSPACE_NAME}`;
  const workspaceResponse = await axios.get(workspaceUrl, {
    headers: {
      'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
      'Content-Type': 'application/vnd.api+json'
    }
  });

  const workspaceId = workspaceResponse.data.data.id;

  // First, list all existing variables
  const existingVarsResponse = await axios.get(
    `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/vars`,
    {
      headers: {
        'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }
  );
  
  console.log('Existing workspace variables BEFORE setting new ones:', existingVarsResponse.data.data.map(v => ({
    key: v.attributes.key,
    value: v.attributes.value,
    category: v.attributes.category,
    sensitive: v.attributes.sensitive
  })));

  // Update workspace variables for the current bucket
  // Note: Using single workspace - variables will overwrite previous bucket variables
  console.log('Setting Terraform variables:', JSON.stringify(variables, null, 2));
  
  for (const [key, value] of Object.entries(variables)) {
    try {
      // Check if variable already exists
      const varsResponse = await axios.get(
        `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/vars`,
        {
          headers: {
            'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
            'Content-Type': 'application/vnd.api+json'
          }
        }
      );

      const existingVar = varsResponse.data.data.find(v => v.attributes.key === key);
      
      if (existingVar) {
        // Update existing variable
        console.log(`Updating existing variable: ${key} = ${value}`);
        await axios.patch(
          `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/vars/${existingVar.id}`,
          {
            data: {
              type: 'vars',
              attributes: {
                value: value.toString()
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          }
        );
        console.log(`Successfully updated variable: ${key}`);
      } else {
        // Create new variable
        console.log(`Creating new variable: ${key} = ${value}`);
        await axios.post(
          `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/vars`,
          {
            data: {
              type: 'vars',
              attributes: {
                key: key,
                value: value.toString(),
                category: 'terraform',
                hcl: false
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          }
        );
        console.log(`Successfully created variable: ${key}`);
      }
    } catch (error) {
      console.error(`Error setting variable ${key}:`, error.response?.data || error.message);
      throw new Error(`Failed to set variable ${key}`);
    }
  }
  
  console.log('All variables set successfully');
  
  // Verify variables were set correctly
  const verifyVarsResponse = await axios.get(
    `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/vars`,
    {
      headers: {
        'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }
  );
  
  console.log('Workspace variables after setting:', verifyVarsResponse.data.data.map(v => ({
    key: v.attributes.key,
    value: v.attributes.value,
    category: v.attributes.category,
    sensitive: v.attributes.sensitive
  })));
  
  // Clean up old variables that Terraform doesn't use
  const varsToDelete = ['storage_class', 'versioning', 'location'];
  for (const varKey of varsToDelete) {
    const varToDelete = verifyVarsResponse.data.data.find(v => v.attributes.key === varKey);
    if (varToDelete) {
      console.log(`Deleting old variable: ${varKey}`);
      try {
        await axios.delete(
          `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/vars/${varToDelete.id}`,
          {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          }
        );
        console.log(`Successfully deleted variable: ${varKey}`);
      } catch (error) {
        console.error(`Error deleting variable ${varKey}:`, error.response?.data || error.message);
      }
    }
  }
  
  // Wait a moment for Terraform Cloud to sync variables
  console.log('Waiting for variables to sync...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get the latest configuration version for the workspace
  console.log(`Getting configuration versions for workspace ${workspaceId}`);
  const configVersionsResponse = await axios.get(
    `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/configuration-versions`,
    {
      headers: {
        'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }
  );

  const configVersions = configVersionsResponse.data.data;
  console.log(`Found ${configVersions?.length || 0} configuration versions`);
  
  if (!configVersions || configVersions.length === 0) {
    console.error('No configuration versions found. This might mean VCS connection failed or repo is empty.');
    throw new Error('No configuration versions found for this workspace. Please ensure your Terraform code is pushed to the repository.');
  }

  // Use the latest configuration version
  const latestConfigVersion = configVersions[0];
  const configVersionId = latestConfigVersion.id;

  // Trigger a run using the workspace's run queue
  // For version control workspaces, this uses the latest configuration version
  const runPayload = {
    data: {
      type: 'runs',
      attributes: {
        'is-destroy': false,
        'auto-apply': false,
        message: 'Provisioning GCP Storage Bucket from IDP Dashboard'
      },
      relationships: {
        workspace: {
          data: {
            type: 'workspaces',
            id: workspaceId
          }
        },
        'configuration-version': {
          data: {
            type: 'configuration-versions',
            id: configVersionId
          }
        }
      }
    }
  };

  // Try creating the run
  console.log('Creating Terraform run with payload:', JSON.stringify(runPayload, null, 2));
  let runResponse;
  try {
    runResponse = await axios.post(
      `${TERRAFORM_CLOUD_API_URL}/runs`,
      runPayload,
      {
        headers: {
          'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
          'Content-Type': 'application/vnd.api+json'
        }
      }
    );
    console.log('Run created successfully:', runResponse.data.data.id);
  } catch (error) {
    console.error('Error creating run:', error.response?.data || error.message);
    // If direct run creation fails, try using the workspace actions API
    console.log('Attempting alternative method...');
    
    // Try using workspace actions to queue a run
    const actionPayload = {
      data: {
        type: 'runs',
        attributes: {
          'is-destroy': false,
          'auto-apply': false,
          message: 'Provisioning GCP Storage Bucket from IDP Dashboard'
        }
      }
    };
    
    runResponse = await axios.post(
      `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/actions/create-run`,
      actionPayload,
      {
        headers: {
          'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
          'Content-Type': 'application/vnd.api+json'
        }
      }
    );
  }

  const runId = runResponse.data.data.id;

  console.log('Terraform run triggered:', runId);
  console.log('Variables:', variables);

  return runId;
}

// Helper function to get run status
async function getRunStatus(runId) {
  try {
    const response = await axios.get(
      `${TERRAFORM_CLOUD_API_URL}/runs/${runId}`,
      {
        headers: {
          'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
          'Content-Type': 'application/vnd.api+json'
        }
      }
    );
    
    const runData = response.data.data;
    const status = runData.attributes.status;
    
    let errorMessage = null;
    
    // If run errored, try to get error details
    if (status === 'errored') {
      try {
        // Get the plan to see if there are errors
        const planResponse = await axios.get(
          `${TERRAFORM_CLOUD_API_URL}/runs/${runId}/plan`,
          {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          }
        );
        
        const planData = planResponse.data.data;
        if (planData.attributes['log-read-url']) {
          // Try to get logs
          try {
            const logsResponse = await axios.get(planData.attributes['log-read-url']);
            const logs = logsResponse.data;
            // Extract error message from logs
            const errorMatch = logs.match(/Error: (.+)/);
            if (errorMatch) {
              errorMessage = errorMatch[1];
            } else {
              errorMessage = 'Terraform plan failed. Check Terraform Cloud for details.';
            }
          } catch (logError) {
            errorMessage = 'Terraform run failed. Check Terraform Cloud for details.';
          }
        }
      } catch (planError) {
        errorMessage = runData.attributes.message || 'Terraform run failed.';
      }
    }
    
    return {
      id: runData.id,
      status: status,
      message: runData.attributes.message,
      'is-destroy': runData.attributes['is-destroy'],
      error: errorMessage
    };
  } catch (error) {
    console.error('Error getting run status:', error.response?.data || error.message);
    throw error;
  }
}

// API Routes for Components
app.get('/api/components', requireAuth, async (req, res) => {
  try {
    const components = await componentDb.findAll();
    res.json(components);
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

app.post('/api/components', requireAuth, async (req, res) => {
  try {
    const { name, description, owner, githubUrl, templateId } = req.body;
    
    if (!name || !description || !owner) {
      return res.status(400).json({ error: 'Name, description, and owner are required' });
    }

    const newComponent = {
      id: Date.now().toString(),
      name,
      description,
      owner,
      type: templateId.includes('service') ? 'Service' : templateId.includes('webapp') ? 'Website' : 'Infrastructure',
      lifecycle: 'Production',
      githubUrl: githubUrl || `https://github.com/foocorp/${name.toLowerCase().replace(/\s+/g, '-')}`
    };

    const component = await componentDb.create(newComponent);
    res.status(201).json(component);
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

app.delete('/api/components/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const component = await componentDb.findById(id);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    await componentDb.delete(id);
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// API Route for GCP Bucket Provisioning
app.post('/api/provision/gcp-bucket', requireAuth, async (req, res) => {
  try {
    const { projectId, bucketName, location, storageClass, versioningEnabled } = req.body;

    if (!projectId || !bucketName) {
      return res.status(400).json({ error: 'Project ID and bucket name are required' });
    }

    console.log('Provisioning GCP bucket:', { projectId, bucketName, location, storageClass, versioningEnabled });

    // Trigger Terraform Cloud run
    const variables = {
      project_id: projectId,
      bucket_name: bucketName,
      region: location || 'US'  // Terraform expects 'region', not 'location'
    };

    const runId = await triggerTerraformRun(variables);

    // Get initial run status
    const runStatus = await getRunStatus(runId);

    // Create component record with run information
    const newComponent = {
      id: Date.now().toString(),
      name: bucketName,
      description: `GCP Storage Bucket in ${projectId}`,
      owner: 'engineering-team',
      type: 'Infrastructure',
      lifecycle: 'Production',
      githubUrl: `https://console.cloud.google.com/storage/browser/${bucketName}?project=${projectId}`,
      terraformRunId: runId,
      terraformStatus: runStatus.status
    };

    const component = await componentDb.create(newComponent);

    res.status(201).json({
      message: 'Bucket provisioning initiated',
      runId,
      runStatus: runStatus.status,
      component: component
    });
  } catch (error) {
    console.error('Error provisioning GCP bucket:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to provision GCP bucket',
      details: error.response?.data || error.message
    });
  }
});

// API Route to check run status
app.get('/api/runs/:runId/status', requireAuth, async (req, res) => {
  try {
    const { runId } = req.params;
    const runStatus = await getRunStatus(runId);
    
    // Update the database with the latest status
    const component = await componentDb.findAll();
    const componentsWithRun = component.find(c => c.terraformRunId === runId);
    
    if (componentsWithRun) {
      // If destroy completed successfully, delete the component from database
      if (runStatus.status === 'applied' && componentsWithRun.isDestroying) {
        console.log(`Destroy completed successfully for component ${componentsWithRun.id}, deleting from database`);
        await componentDb.delete(componentsWithRun.id);
        console.log(`Component ${componentsWithRun.id} deleted from database`);
      } else {
        // Update status normally
        await componentDb.update(componentsWithRun.id, {
          terraformStatus: runStatus.status,
          terraformError: runStatus.error || null
        });
        console.log(`Updated component ${componentsWithRun.id} status in database: ${runStatus.status}`);
      }
    }
    
    res.json(runStatus);
  } catch (error) {
    console.error('Error getting run status:', error);
    res.status(500).json({ error: 'Failed to get run status' });
  }
});

// API Route to destroy infrastructure
app.post('/api/components/:id/destroy', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const component = await componentDb.findById(id);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // If component has a Terraform run ID, trigger destroy
    // Note: component comes from database in camelCase format
    if (component.terraformRunId) {
      try {
        // Get workspace ID - using single workspace for all buckets
        const workspaceUrl = `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces/${TERRAFORM_CLOUD_WORKSPACE_NAME}`;
        const workspaceResponse = await axios.get(workspaceUrl, {
          headers: {
            'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
            'Content-Type': 'application/vnd.api+json'
          }
        });

        const workspaceId = workspaceResponse.data.data.id;

        // Get latest configuration version
        const configVersionsResponse = await axios.get(
          `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}/configuration-versions`,
          {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          }
        );

        const configVersionId = configVersionsResponse.data.data[0].id;

        // Create a destroy run
        const destroyPayload = {
          data: {
            type: 'runs',
            attributes: {
              'is-destroy': true,
              'auto-apply': false,
              message: `Destroying ${component.name} from IDP Dashboard`
            },
            relationships: {
              workspace: {
                data: {
                  type: 'workspaces',
                  id: workspaceId
                }
              },
              'configuration-version': {
                data: {
                  type: 'configuration-versions',
                  id: configVersionId
                }
              }
            }
          }
        };

        const destroyResponse = await axios.post(
          `${TERRAFORM_CLOUD_API_URL}/runs`,
          destroyPayload,
          {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          }
        );

        const destroyRunId = destroyResponse.data.data.id;

        // Update component status - mark as destroying
        await componentDb.update(id, { 
          terraformStatus: 'applying',
          terraformRunId: destroyRunId,
          isDestroying: true
        });
        
        console.log(`Destroy initiated for component ${id}, run ID: ${destroyRunId}`);

        return res.json({ 
          message: 'Destroy initiated',
          runId: destroyRunId 
        });
      } catch (error) {
        console.error('Error triggering destroy:', error);
        return res.status(500).json({ error: 'Failed to trigger destroy' });
      }
    }

    // If no Terraform run, just delete from database
    await componentDb.delete(id);
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error destroying component:', error);
    res.status(500).json({ error: 'Failed to destroy component' });
  }
});

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Create tables if they don't exist
    await pool.query(schema);
    console.log('Database tables initialized successfully');
  } catch (error) {
    // If tables already exist, that's fine
    if (error.code !== '42P07') { // Error code for "already exists"
      console.error('Error initializing database:', error.message);
    }
  }
}

// API endpoint to clear all components (for debugging)
app.delete('/api/components', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM components');
    console.log(`Deleted ${result.rowCount} components from database`);
    res.json({ message: `Deleted ${result.rowCount} components` });
  } catch (error) {
    console.error('Error deleting components:', error);
    res.status(500).json({ error: 'Failed to delete components' });
  }
});

// Start server after database initialization
async function startServer() {
  await initializeDatabase();
  
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

startServer();
