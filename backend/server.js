require('dotenv').config({ debug: true });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fs = require('fs');
const path = require('path');
const pool = require('./database');
const { users: userDb, components: componentDb } = require('./db-helpers');
const SERVICE_CONFIG = require('./service-config');

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
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
}));

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_ORG_NAME = process.env.GITHUB_ORG_NAME || 'sajjadkhan12'; // Default GitHub organization name
const GITHUB_PERSONAL_TOKEN = process.env.GITHUB_PERSONAL_TOKEN; // Token for creating repos and fetching templates
const TEMPLATE_REPO_OWNER = 'sajjadkhan12';
const TEMPLATE_REPO_NAME = 'idp-templates';
const TEMPLATE_BRANCH = 'main';

// Terraform Cloud Configuration
const TERRAFORM_CLOUD_API_TOKEN = process.env.TERRAFORM_CLOUD_API_TOKEN;
const TERRAFORM_CLOUD_ORG_NAME = process.env.TERRAFORM_CLOUD_ORG_NAME;
const TERRAFORM_CLOUD_REPO = process.env.TERRAFORM_CLOUD_REPO;

// Validate required environment variables
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.error('Error: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in environment variables');
  process.exit(1);
}

if (!TERRAFORM_CLOUD_API_TOKEN || !TERRAFORM_CLOUD_ORG_NAME || !TERRAFORM_CLOUD_REPO) {
  console.warn('Warning: Terraform Cloud configuration is incomplete. Some features may not work.');
  console.warn('Please set TERRAFORM_CLOUD_API_TOKEN, TERRAFORM_CLOUD_ORG_NAME, and TERRAFORM_CLOUD_REPO');
}
const TERRAFORM_CLOUD_BRANCH = process.env.TERRAFORM_CLOUD_BRANCH || 'main';
const TERRAFORM_CLOUD_WORKING_DIR = process.env.TERRAFORM_CLOUD_WORKING_DIR || 'terraform-configs';
const TERRAFORM_CLOUD_TF_VERSION = process.env.TERRAFORM_CLOUD_TF_VERSION || '1.6.0';
const TERRAFORM_CLOUD_OAUTH_TOKEN_ID = process.env.TERRAFORM_CLOUD_OAUTH_TOKEN_ID;
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
app.get('/api/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userDb.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send the access token to the client
    const { access_token, ...userWithoutToken } = user;
    res.json({ ...userWithoutToken, role: 'admin' });
  } catch (error) {
    console.error('Error in /api/me:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
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
async function getOAuthTokenId() {
  if (TERRAFORM_CLOUD_OAUTH_TOKEN_ID) {
    console.log('Using provided OAuth token ID:', TERRAFORM_CLOUD_OAUTH_TOKEN_ID);
    return TERRAFORM_CLOUD_OAUTH_TOKEN_ID;
  }

  console.log('Fetching OAuth token ID for GitHub...');
  try {
    const oauthResponse = await axios.get(
      `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/oauth-tokens`,
      {
        headers: {
          'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
          'Content-Type': 'application/vnd.api+json'
        }
      }
    );

    console.log('OAuth tokens response:', JSON.stringify(oauthResponse.data, null, 2));
    
    // First, try to find a token with service-provider attribute
    let oauthToken = oauthResponse.data.data?.find(token => 
      token.attributes['service-provider'] === 'github'
    );

    // If not found, get the OAuth client to check the provider
    if (!oauthToken && oauthResponse.data.data?.length > 0) {
      console.log('Checking OAuth client for service provider...');
      const firstToken = oauthResponse.data.data[0];
      const oauthClientId = firstToken.relationships['oauth-client'].data.id;
      
      const oauthClientResponse = await axios.get(
        `${TERRAFORM_CLOUD_API_URL}/oauth-clients/${oauthClientId}`,
        {
          headers: {
            'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
            'Content-Type': 'application/vnd.api+json'
          }
        }
      );
      
      console.log('OAuth client response:', JSON.stringify(oauthClientResponse.data, null, 2));
      
      const serviceProvider = oauthClientResponse.data.data.attributes['service-provider'];
      
      if (serviceProvider === 'github') {
        oauthToken = firstToken;
        console.log('Found GitHub OAuth token:', oauthToken.id);
      }
    }

    if (!oauthToken) {
      console.log('Available OAuth tokens:', oauthResponse.data.data?.map(t => ({
        id: t.id,
        provider: t.attributes['service-provider']
      })));
      
      // Try to get OAuth token from an existing workspace
      console.log('Trying to get OAuth token from an existing workspace...');
      try {
        const workspacesResponse = await axios.get(
          `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces`,
          {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          }
        );
        
        const workspaces = workspacesResponse.data.data || [];
        console.log(`Found ${workspaces.length} workspaces`);
        
        // Find a workspace with VCS connection
        for (const workspace of workspaces) {
          if (workspace.relationships && workspace.relationships['vcs-repo']) {
            const vcsRepoId = workspace.relationships['vcs-repo'].data?.id;
            if (vcsRepoId) {
              console.log(`Found workspace with VCS: ${workspace.attributes.name}`);
              // Get the OAuth token ID from the VCS repo
              const vcsRepoResponse = await axios.get(
                `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/vcs-repos/${vcsRepoId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
                    'Content-Type': 'application/vnd.api+json'
                  }
                }
              );
              
              const oauthTokenId = vcsRepoResponse.data.data.attributes['oauth-token-id'];
              if (oauthTokenId) {
                console.log('Found OAuth token ID from workspace:', oauthTokenId);
                return oauthTokenId;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching workspace VCS info:', error.response?.data || error.message);
      }
      
      throw new Error('No GitHub OAuth token found. Please set up a GitHub VCS provider in Terraform Cloud.');
    }

    console.log('Found OAuth token ID:', oauthToken.id);
    return oauthToken.id;
  } catch (error) {
    console.error('Error fetching OAuth tokens:', error.response?.data || error.message);
    throw error;
  }
}

async function createWorkspace(bucketName, serviceType = 'gcp-bucket') {
  if (!TERRAFORM_CLOUD_API_TOKEN || !TERRAFORM_CLOUD_ORG_NAME || !TERRAFORM_CLOUD_REPO) {
    throw new Error('Terraform Cloud configuration is missing. Please set TERRAFORM_CLOUD_API_TOKEN, TERRAFORM_CLOUD_ORG_NAME, and TERRAFORM_CLOUD_REPO environment variables.');
  }

  const workspaceName = `${bucketName}_${Math.random().toString(36).substr(2, 8)}`;
  const oauthTokenId = await getOAuthTokenId();

  // Get service configuration
  const serviceConfig = SERVICE_CONFIG[serviceType];
  if (!serviceConfig) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  const workingDir = serviceConfig.workingDir;

  console.log(`Creating workspace: ${workspaceName} with working directory: ${workingDir}`);

  const createPayload = {
    data: {
      type: 'workspaces',
      attributes: {
        name: workspaceName,
        description: `Workspace for ${serviceConfig.description} ${bucketName}`,
        'auto-apply': true,
        'working-directory': workingDir,
        'terraform-version': TERRAFORM_CLOUD_TF_VERSION,
        'vcs-repo': {
          identifier: TERRAFORM_CLOUD_REPO,
          'oauth-token-id': oauthTokenId,
          branch: TERRAFORM_CLOUD_BRANCH,
          'ingress-submodules': false
        }
      }
    }
  };

  const createResponse = await axios.post(
    `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces`,
    createPayload,
    {
      headers: {
        'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }
  );

  const workspaceId = createResponse.data.data.id;
  console.log(`Workspace created with ID: ${workspaceId}`);

  return { workspaceId, workspaceName };
}

async function triggerTerraformRun(variables, serviceType = 'gcp-bucket') {
  if (!TERRAFORM_CLOUD_API_TOKEN || !TERRAFORM_CLOUD_ORG_NAME) {
    throw new Error('Terraform Cloud configuration is missing. Please set TERRAFORM_CLOUD_API_TOKEN and TERRAFORM_CLOUD_ORG_NAME environment variables.');
  }

  // Create a new workspace for this service
  const { workspaceId, workspaceName } = await createWorkspace(variables.bucket_name || variables.cluster_name || variables.name, serviceType);

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
        'auto-apply': true,
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
          'auto-apply': true,
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

  return { runId, workspaceId, workspaceName };
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

// Helper function to fetch files from GitHub repository
async function fetchFilesFromGitHub(owner, repo, path, branch = 'main') {
  const token = GITHUB_PERSONAL_TOKEN || process.env.GITHUB_TOKEN;
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers: { 'Accept': 'application/vnd.github.v3+json', ...authHeaders } }
    );
    
    const files = [];
    
    for (const item of response.data) {
      if (item.type === 'file') {
        // Fetch file content
        const fileResponse = await axios.get(item.url, { headers: authHeaders });
        files.push({
          path: item.path,
          content: fileResponse.data.content,
          sha: item.sha
        });
      } else if (item.type === 'dir') {
        // Recursively fetch files from subdirectory
        const subFiles = await fetchFilesFromGitHub(owner, repo, item.path, branch);
        files.push(...subFiles);
      }
    }
    
    return files;
  } catch (error) {
    console.error(`Error fetching files from GitHub: ${error.message}`);
    throw new Error(`Failed to fetch template from GitHub: ${error.message}`);
  }
}

// Helper function to create GitHub repository from template
async function createGitHubRepoFromTemplate(user, repoName, description, templateSource) {
  const personalToken = GITHUB_PERSONAL_TOKEN || process.env.GITHUB_TOKEN;
  
  console.log('createGitHubRepoFromTemplate called with:', { repoName, description, templateSource });
  console.log('GITHUB_PERSONAL_TOKEN available:', !!personalToken);
  
  if (!personalToken) {
    throw new Error('GITHUB_PERSONAL_TOKEN is not set in environment variables');
  }

  // Step 1: Create the repository
  console.log(`Creating GitHub repository: ${GITHUB_ORG_NAME}/${repoName}`);
  
  let repoUrl;
  
  try {
    // Try to create in organization
    const createRepoResponse = await axios.post(
      `https://api.github.com/orgs/${GITHUB_ORG_NAME}/repos`,
      {
        name: repoName,
        description: description || 'Created from IDP template',
        private: false,
        auto_init: true // Initialize with README
      },
      {
        headers: {
          'Authorization': `Bearer ${personalToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    repoUrl = createRepoResponse.data.html_url;
    console.log(`Repository created: ${repoUrl}`);
  } catch (error) {
    console.error('Error creating organization repo, trying user repo:', error.response?.data);
    
    // Fallback: Create in user's account
    try {
      const createRepoResponse = await axios.post(
        'https://api.github.com/user/repos',
        {
          name: repoName,
          description: description || 'Created from IDP template',
          private: false,
          auto_init: true
        },
        {
          headers: {
            'Authorization': `Bearer ${personalToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      repoUrl = createRepoResponse.data.html_url;
      console.log(`Repository created (user account): ${repoUrl}`);
    } catch (fallbackError) {
      console.error('Error creating GitHub repository:', fallbackError.response?.data);
      throw new Error('Failed to create GitHub repository');
    }
  }

  // Step 2: Fetch template files from GitHub
  console.log(`Fetching template files from GitHub: ${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}/${templateSource}`);
  
  try {
    const templateFiles = await fetchFilesFromGitHub(
      TEMPLATE_REPO_OWNER, 
      TEMPLATE_REPO_NAME, 
      templateSource,
      TEMPLATE_BRANCH
    );
    
    console.log(`Found ${templateFiles.length} template files to copy:`, templateFiles.map(f => f.path));
    
    // Step 3: Upload files to the new repository
    for (const file of templateFiles) {
      // Skip certain files
      if (file.path.includes('.git') || file.path.includes('node_modules')) {
        continue;
      }
      
      try {
        // Get base64 content from GitHub's base64 encoded response
        const base64Content = file.content;
        
        // Extract filename only (remove template folder prefix)
        // file.path is like "python-service/main.py" but we want "main.py"
        // Or if templateSource is "python-service", remove everything before the last slash
        const pathParts = file.path.split('/');
        const filePathForRepo = pathParts[pathParts.length - 1]; // Get just the filename
        
        console.log(`Processing file: ${file.path} -> ${filePathForRepo}`);
        
        // First try to get the file's current SHA if it exists
        let sha = null;
        try {
          const getResponse = await axios.get(
            `https://api.github.com/repos/${GITHUB_ORG_NAME}/${repoName}/contents/${filePathForRepo}`,
            {
              headers: {
                'Authorization': `Bearer ${personalToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );
          sha = getResponse.data.sha;
        } catch (getError) {
          // File doesn't exist yet, which is fine
        }
        
        const payload = {
          message: sha ? `Update ${filePathForRepo} from template` : `Add ${filePathForRepo} from template`,
          content: base64Content,
          committer: {
            name: 'IDP Service',
            email: 'noreply@idp.com'
          }
        };
        
        // Add SHA if updating existing file
        if (sha) {
          payload.sha = sha;
        }
        
        // Update or create file in repository using the filename only
        await axios.put(
          `https://api.github.com/repos/${GITHUB_ORG_NAME}/${repoName}/contents/${filePathForRepo}`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${personalToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        console.log(`Successfully added/updated file: ${filePathForRepo}`);
      } catch (fileError) {
        console.error(`Error creating file ${file.path}:`, fileError.response?.data || fileError.message);
        // Continue with other files even if one fails
      }
    }
  } catch (error) {
    console.error('Error fetching template from GitHub:', error);
    throw new Error(`Failed to fetch template from GitHub: ${error.message}`);
  }

  console.log(`Repository setup complete: ${repoUrl}`);
  
  return repoUrl;
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
    
    console.log('Received component creation request:', { name, description, owner, githubUrl, templateId });
    
    if (!name || !description || !owner) {
      return res.status(400).json({ error: 'Name, description, and owner are required' });
    }

    let finalGithubUrl = githubUrl;
    let targetRepoName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // If this is a Python service, create the repo from template
    if (templateId === 'python-service') {
      try {
        console.log('Python service detected. Checking environment...');
        
        // Check if GITHUB_PERSONAL_TOKEN is set
        if (!GITHUB_PERSONAL_TOKEN) {
          console.error('GITHUB_PERSONAL_TOKEN is not set in environment variables');
          throw new Error('GITHUB_PERSONAL_TOKEN environment variable is required for creating repositories from templates');
        }
        
        // Extract repo name from githubUrl if provided
        if (githubUrl) {
          // githubUrl format: https://github.com/org/repo
          const match = githubUrl.match(/github\.com\/[^/]+\/([^/]+)/);
          if (match) {
            targetRepoName = match[1];
          }
        }
        
        console.log(`Creating Python service from template: ${name}, repo: ${targetRepoName}`);
        console.log(`Template source: ${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}/python-service`);
        console.log(`Target organization: ${GITHUB_ORG_NAME}`);
        
        // Create GitHub repo from template
        const repoUrl = await createGitHubRepoFromTemplate(
          null, // user is not needed, we use GITHUB_PERSONAL_TOKEN
          targetRepoName,
          description,
          'python-service' // Path in the template repository
        );
        
        finalGithubUrl = repoUrl;
        console.log(`Python service created successfully: ${repoUrl}`);
      } catch (templateError) {
        console.error('Error creating service from template:', templateError);
        console.error('Error stack:', templateError.stack);
        return res.status(500).json({ 
          error: 'Failed to create service from template',
          details: templateError.message 
        });
      }
    }

    // Extract repository info for storing in database
    let githubRepoOwner = null;
    let githubRepoName = null;
    
    if (finalGithubUrl) {
      const match = finalGithubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        githubRepoOwner = match[1];
        githubRepoName = match[2];
      }
    }
    
    const newComponent = {
      id: Date.now().toString(),
      name,
      description,
      owner,
      type: templateId.includes('service') ? 'Service' : templateId.includes('webapp') ? 'Website' : 'Infrastructure',
      lifecycle: 'Production',
      githubUrl: finalGithubUrl || `https://github.com/${GITHUB_ORG_NAME}/${name.toLowerCase().replace(/\s+/g, '-')}`,
      ...(githubRepoOwner && githubRepoName ? { githubRepoOwner, githubRepoName } : {})
    };

    console.log('Creating component in database:', newComponent);
    const component = await componentDb.create(newComponent);
    console.log('Component created successfully in database');
    
    res.status(201).json(component);
  } catch (error) {
    console.error('Error creating component:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create component',
      details: error.message 
    });
  }
});

app.delete('/api/components/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const component = await componentDb.findById(id);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Check if this is a Python service and delete GitHub repo
    if (component.type === 'Service' && component.githubRepoOwner && component.githubRepoName) {
      try {
        console.log(`Deleting GitHub repository: ${component.githubRepoOwner}/${component.githubRepoName}`);
        
        // Delete the GitHub repository
        await axios.delete(
          `https://api.github.com/repos/${component.githubRepoOwner}/${component.githubRepoName}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_PERSONAL_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        console.log(`Successfully deleted GitHub repository: ${component.githubRepoOwner}/${component.githubRepoName}`);
      } catch (deleteError) {
        console.error('Error deleting GitHub repository:', deleteError.response?.data || deleteError.message);
        // Continue with database deletion even if GitHub deletion fails
      }
    }

    await componentDb.delete(id);
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// API Route for GCP K8s Cluster Provisioning
app.post('/api/provision/gcp-k8s', requireAuth, async (req, res) => {
  try {
    const { projectId, clusterName, region, nodeCount, machineType } = req.body;
    
    if (!projectId || !clusterName || !region) {
      return res.status(400).json({ error: 'Project ID, cluster name, and region are required' });
    }

    console.log('Provisioning GCP K8s cluster:', {
      projectId,
      clusterName,
      region,
      nodeCount: nodeCount || 3,
      machineType: machineType || 'e2-medium'
    });

    const variables = {
      project_id: projectId,
      cluster_name: clusterName,
      region: region,
      node_count: nodeCount || 3,
      machine_type: machineType || 'e2-medium'
    };

    const { runId, workspaceId, workspaceName } = await triggerTerraformRun(variables, 'gcp-k8s');

    // Get initial run status
    const runStatus = await getRunStatus(runId);

    // Create component record with run information
    const newComponent = {
      id: Date.now().toString(),
      name: clusterName,
      description: `GCP Kubernetes Cluster in ${projectId}`,
      owner: 'engineering-team',
      type: 'Infrastructure',
      lifecycle: 'Production',
      githubUrl: `https://console.cloud.google.com/kubernetes/cluster/list?project=${projectId}`,
      terraformRunId: runId,
      terraformStatus: runStatus.status,
      workspaceName: workspaceName
    };

    const component = await componentDb.create(newComponent);

    res.status(201).json({
      message: 'K8s cluster provisioning initiated',
      component,
      runId,
      status: runStatus.status
    });
  } catch (error) {
    console.error('Error provisioning GCP K8s cluster:', error);
    res.status(500).json({ 
      error: 'Failed to provision GCP K8s cluster',
      details: error.message 
    });
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

    const { runId, workspaceId, workspaceName } = await triggerTerraformRun(variables, 'gcp-bucket');

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
      terraformStatus: runStatus.status,
      workspaceName: workspaceName
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
    console.error('Error stack:', error.stack);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to provision GCP bucket',
      details: error.response?.data || error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generic API Route for Service Provisioning
app.post('/api/provision/:serviceType', requireAuth, async (req, res) => {
  try {
    const { serviceType } = req.params;
    const variables = req.body;
    
    // Get service configuration
    const serviceConfig = SERVICE_CONFIG[serviceType];
    if (!serviceConfig) {
      return res.status(400).json({ error: `Unknown service type: ${serviceType}` });
    }

    // Validate required variables
    const missingVars = serviceConfig.variables.filter(varName => !variables[varName]);
    if (missingVars.length > 0) {
      return res.status(400).json({ 
        error: `Missing required variables: ${missingVars.join(', ')}` 
      });
    }

    console.log(`Provisioning ${serviceConfig.description}:`, variables);

    const { runId, workspaceId, workspaceName } = await triggerTerraformRun(variables, serviceType);

    // Get initial run status
    const runStatus = await getRunStatus(runId);

    // Generate GitHub URL based on service type
    const githubUrl = serviceConfig.githubUrl(variables.project_id || variables.region, variables.bucket_name || variables.cluster_name || variables.instance_name);

    // Create component record with run information
    const newComponent = {
      id: Date.now().toString(),
      name: variables.bucket_name || variables.cluster_name || variables.instance_name || variables.name,
      description: `${serviceConfig.description} in ${variables.project_id || variables.region}`,
      owner: 'engineering-team',
      type: 'Infrastructure',
      lifecycle: 'Production',
      githubUrl: githubUrl,
      terraformRunId: runId,
      terraformStatus: runStatus.status,
      workspaceName: workspaceName
    };

    const component = await componentDb.create(newComponent);

    res.status(201).json({
      message: `${serviceConfig.description} provisioning initiated`,
      component,
      runId,
      status: runStatus.status
    });
  } catch (error) {
    console.error(`Error provisioning ${req.params.serviceType}:`, error);
    res.status(500).json({ 
      error: `Failed to provision ${req.params.serviceType}`,
      details: error.message 
    });
  }
});

// API Route to check run status
app.get('/api/runs/:runId/status', requireAuth, async (req, res) => {
  try {
    const { runId } = req.params;
    console.log(`Status check for run: ${runId}`);
    const runStatus = await getRunStatus(runId);
    
    // Update the database with the latest status
    const component = await componentDb.findAll();
    const componentsWithRun = component.find(c => c.terraformRunId === runId);
    
    if (componentsWithRun) {
      console.log(`Found component ${componentsWithRun.id}, status: ${runStatus.status}, isDestroying: ${componentsWithRun.isDestroying}`);
      
      // If destroy completed successfully, delete the component from database
      if (runStatus.status === 'applied' && componentsWithRun.isDestroying) {
        console.log(`Destroy completed successfully for component ${componentsWithRun.id}, deleting from database`);
        
        // Delete the workspace after successful destroy
        if (componentsWithRun.workspaceName) {
          try {
            const workspaceUrl = `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces/${componentsWithRun.workspaceName}`;
            await axios.delete(workspaceUrl, {
              headers: {
                'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
                'Content-Type': 'application/vnd.api+json'
              }
            });
            console.log(`Workspace ${componentsWithRun.workspaceName} deleted successfully`);
          } catch (error) {
            console.error(`Error deleting workspace ${componentsWithRun.workspaceName}:`, error.response?.data || error.message);
          }
        } else {
          // Fallback: get workspace from run and delete it
          try {
            const runResponse = await axios.get(
              `${TERRAFORM_CLOUD_API_URL}/runs/${runId}`,
              {
                headers: {
                  'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
                  'Content-Type': 'application/vnd.api+json'
                }
              }
            );
            const workspaceId = runResponse.data.data.relationships.workspace.data.id;
            
            const workspaceResponse = await axios.get(
              `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}`,
              {
                headers: {
                  'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
                  'Content-Type': 'application/vnd.api+json'
                }
              }
            );
            const workspaceName = workspaceResponse.data.data.attributes.name;
            
            const workspaceUrl = `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces/${workspaceName}`;
            await axios.delete(workspaceUrl, {
              headers: {
                'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
                'Content-Type': 'application/vnd.api+json'
              }
            });
            console.log(`Workspace ${workspaceName} deleted successfully (fallback)`);
          } catch (error) {
            console.error(`Error deleting workspace (fallback):`, error.response?.data || error.message);
          }
        }
        
        await componentDb.delete(componentsWithRun.id);
        console.log(`Component ${componentsWithRun.id} deleted from database`);
      } else {
        // Update status normally
        const updateData = {
          terraformStatus: runStatus.status,
          terraformError: runStatus.error || null
        };
        
        // If destroy failed (errored), clear the isDestroying flag
        if (runStatus.status === 'errored' && componentsWithRun.isDestroying) {
          updateData.isDestroying = false;
          console.log(`Destroy failed for component ${componentsWithRun.id}, clearing isDestroying flag`);
        }
        
        await componentDb.update(componentsWithRun.id, updateData);
        console.log(`Updated component ${componentsWithRun.id} status in database: ${runStatus.status}`);
      }
    }
    
    res.json(runStatus);
  } catch (error) {
    console.error('Error getting run status:', error);
    res.status(500).json({ error: 'Failed to get run status' });
  }
});

// API Route to clear all components (for debugging)
app.delete('/api/components', requireAuth, async (req, res) => {
  try {
    console.log('Clearing all components from database...');
    const result = await pool.query('DELETE FROM components');
    console.log(`Deleted ${result.rowCount} components from database`);
    
    res.json({ 
      message: 'All components cleared successfully',
      deletedCount: result.rowCount 
    });
  } catch (error) {
    console.error('Error clearing components:', error);
    res.status(500).json({ error: 'Failed to clear components' });
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
        let workspaceId;
        
        // Try to get workspace ID from component's workspace name first
        if (component.workspaceName) {
          console.log(`Using workspace name: ${component.workspaceName}`);
          const workspaceUrl = `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces/${component.workspaceName}`;
          const workspaceResponse = await axios.get(workspaceUrl, {
            headers: {
              'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
              'Content-Type': 'application/vnd.api+json'
            }
          });
          workspaceId = workspaceResponse.data.data.id;
        } else {
          // Fallback: get workspace ID from the run
          console.log(`Getting workspace from run ID: ${component.terraformRunId}`);
          const runResponse = await axios.get(
            `${TERRAFORM_CLOUD_API_URL}/runs/${component.terraformRunId}`,
            {
              headers: {
                'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
                'Content-Type': 'application/vnd.api+json'
              }
            }
          );
          workspaceId = runResponse.data.data.relationships.workspace.data.id;
          console.log(`Found workspace ID from run: ${workspaceId}`);
          
          // Get workspace name for deletion later
          const workspaceResponse = await axios.get(
            `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}`,
            {
              headers: {
                'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
                'Content-Type': 'application/vnd.api+json'
              }
            }
          );
          const workspaceName = workspaceResponse.data.data.attributes.name;
          
          // Update component with workspace name for future deletion
          await componentDb.update(component.id, { workspaceName });
          console.log(`Updated component with workspace name: ${workspaceName}`);
        }

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
              'auto-apply': true,
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

    // If no Terraform run, check if it's a Python service and delete GitHub repo
    if (component.type === 'Service' && (component.githubRepoOwner && component.githubRepoName)) {
      try {
        console.log(`Deleting GitHub repository: ${component.githubRepoOwner}/${component.githubRepoName}`);
        
        // Delete the GitHub repository
        await axios.delete(
          `https://api.github.com/repos/${component.githubRepoOwner}/${component.githubRepoName}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_PERSONAL_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        console.log(`Successfully deleted GitHub repository: ${component.githubRepoOwner}/${component.githubRepoName}`);
      } catch (deleteError) {
        console.error('Error deleting GitHub repository:', deleteError.response?.data || deleteError.message);
        // Continue with database deletion even if GitHub deletion fails
      }
    }
    
    // Delete from database
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
    
    // Add workspace_name column if it doesn't exist
    try {
      await pool.query('ALTER TABLE components ADD COLUMN IF NOT EXISTS workspace_name VARCHAR(255)');
      console.log('Database schema updated successfully');
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Database schema check completed');
    }
    
    // Add GitHub repo columns if they don't exist
    try {
      await pool.query('ALTER TABLE components ADD COLUMN IF NOT EXISTS github_repo_owner VARCHAR(255)');
      await pool.query('ALTER TABLE components ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(255)');
      console.log('GitHub repo columns added successfully');
    } catch (error) {
      // Columns might already exist, ignore error
      console.log('GitHub repo columns check completed');
    }
    
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

// Debug endpoint to check template setup (defined after helper functions)
app.get('/api/debug/template-config', requireAuth, async (req, res) => {
  try {
    const config = {
      hasPersonalToken: !!GITHUB_PERSONAL_TOKEN,
      templateRepoOwner: TEMPLATE_REPO_OWNER,
      templateRepoName: TEMPLATE_REPO_NAME,
      targetOrg: GITHUB_ORG_NAME,
      personalTokenLength: GITHUB_PERSONAL_TOKEN ? GITHUB_PERSONAL_TOKEN.length : 0
    };
    
    // Try to fetch files from GitHub to test connection
    let testFetch = null;
    try {
      // Check if fetchFilesFromGitHub is defined
      if (typeof fetchFilesFromGitHub === 'function') {
        const files = await fetchFilesFromGitHub(
          TEMPLATE_REPO_OWNER,
          TEMPLATE_REPO_NAME,
          'python-service',
          TEMPLATE_BRANCH
        );
        testFetch = {
          success: true,
          fileCount: files.length,
          files: files.map(f => f.path)
        };
      } else {
        testFetch = {
          success: false,
          error: 'fetchFilesFromGitHub function not defined'
        };
      }
    } catch (error) {
      testFetch = {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
    
    res.json({ config, testFetch });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Start server after database initialization
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
      console.log(`TEMPLATE_REPO: ${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
