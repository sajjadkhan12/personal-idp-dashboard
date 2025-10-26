const axios = require('axios');
const config = require('../config');
const SERVICE_CONFIG = require('../service-config');

const {
  TERRAFORM_CLOUD_API_TOKEN,
  TERRAFORM_CLOUD_ORG_NAME,
  TERRAFORM_CLOUD_REPO,
  TERRAFORM_CLOUD_BRANCH,
  TERRAFORM_CLOUD_API_URL,
  TERRAFORM_CLOUD_TF_VERSION,
  TERRAFORM_CLOUD_OAUTH_TOKEN_ID,
} = config;

/**
 * Get OAuth token ID from Terraform Cloud
 */
async function getOAuthTokenId() {
  if (TERRAFORM_CLOUD_OAUTH_TOKEN_ID) {
    return TERRAFORM_CLOUD_OAUTH_TOKEN_ID;
  }
  
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

    // First, try to find a token with service-provider attribute
    let oauthToken = oauthResponse.data.data?.find(token => 
      token.attributes['service-provider'] === 'github'
    );

    // If not found, get the OAuth client to check the provider
    if (!oauthToken && oauthResponse.data.data?.length > 0) {
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
      
      const serviceProvider = oauthClientResponse.data.data.attributes['service-provider'];
      
      if (serviceProvider === 'github') {
        oauthToken = firstToken;
      }
    }

    if (!oauthToken) {
      // Try to get OAuth token from an existing workspace
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
        
        // Find a workspace with VCS connection
        for (const workspace of workspaces) {
          if (workspace.relationships && workspace.relationships['vcs-repo']) {
            const vcsRepoId = workspace.relationships['vcs-repo'].data?.id;
            if (vcsRepoId) {
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
    
    return oauthToken.id;
  } catch (error) {
    console.error('Error fetching OAuth tokens:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a Terraform Cloud workspace
 */
async function createWorkspace(bucketName, serviceType = 'gcp-bucket') {
  if (!TERRAFORM_CLOUD_API_TOKEN || !TERRAFORM_CLOUD_ORG_NAME || !TERRAFORM_CLOUD_REPO) {
    throw new Error('Terraform Cloud configuration is missing. Please set TERRAFORM_CLOUD_API_TOKEN, TERRAFORM_CLOUD_ORG_NAME, and TERRAFORM_CLOUD_REPO environment variables.');
  }

  const workspaceName = `${bucketName}_${Math.random().toString(36).substr(2, 8)}`;
  const oauthTokenId = await getOAuthTokenId();

  const serviceConfig = SERVICE_CONFIG[serviceType];
  if (!serviceConfig) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  const workingDir = serviceConfig.workingDir;

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

  return { workspaceId, workspaceName };
}

/**
 * Trigger a Terraform run
 */
async function triggerTerraformRun(variables, serviceType = 'gcp-bucket') {
  if (!TERRAFORM_CLOUD_API_TOKEN || !TERRAFORM_CLOUD_ORG_NAME) {
    throw new Error('Terraform Cloud configuration is missing. Please set TERRAFORM_CLOUD_API_TOKEN and TERRAFORM_CLOUD_ORG_NAME environment variables.');
  }

  // Create a new workspace for this service
  const { workspaceId, workspaceName } = await createWorkspace(
    variables.bucket_name || variables.cluster_name || variables.name, 
    serviceType
  );

  // Update workspace variables for the current bucket
  for (const [key, value] of Object.entries(variables)) {
    try {
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
      } else {
        // Create new variable
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
      }
    } catch (error) {
      console.error(`Error setting variable ${key}:`, error.response?.data || error.message);
      throw new Error(`Failed to set variable ${key}`);
    }
  }
  
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
  
  // Clean up old variables that Terraform doesn't use
  const varsToDelete = ['storage_class', 'versioning', 'location'];
  for (const varKey of varsToDelete) {
    const varToDelete = verifyVarsResponse.data.data.find(v => v.attributes.key === varKey);
    if (varToDelete) {
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
      } catch (error) {
        console.error(`Error deleting variable ${varKey}:`, error.response?.data || error.message);
      }
    }
  }
  
  // Wait a moment for Terraform Cloud to sync variables
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get the latest configuration version for the workspace
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
  
  if (!configVersions || configVersions.length === 0) {
    console.error('No configuration versions found. This might mean VCS connection failed or repo is empty.');
    throw new Error('No configuration versions found for this workspace. Please ensure your Terraform code is pushed to the repository.');
  }

  const latestConfigVersion = configVersions[0];
  const configVersionId = latestConfigVersion.id;

  const serviceConfig2 = SERVICE_CONFIG[serviceType];
  
  const runPayload = {
    data: {
      type: 'runs',
      attributes: {
        'is-destroy': false,
        'auto-apply': true,
        message: `Provisioning ${serviceConfig2.description} from IDP Dashboard`
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
  } catch (error) {
    console.error('Error creating run:', error.response?.data || error.message);
    
    // Try alternative method
    const actionPayload = {
      data: {
        type: 'runs',
        attributes: {
          'is-destroy': false,
          'auto-apply': true,
          message: `Provisioning ${serviceConfig2.description} from IDP Dashboard`
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

  return { runId, workspaceId, workspaceName };
}

/**
 * Get Terraform run status
 */
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
          try {
            const logsResponse = await axios.get(planData.attributes['log-read-url']);
            const logs = logsResponse.data;
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

/**
 * Trigger a destroy run for a workspace
 */
async function triggerDestroyRun(workspaceId, workspaceName, componentName) {
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

  const destroyPayload = {
    data: {
      type: 'runs',
      attributes: {
        'is-destroy': true,
        'auto-apply': true,
        message: `Destroying ${componentName} from IDP Dashboard`
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

  return destroyRunId;
}

/**
 * Delete a workspace by name
 */
async function deleteWorkspace(workspaceName) {
  try {
    const workspaceUrl = `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces/${workspaceName}`;
    await axios.delete(workspaceUrl, {
      headers: {
        'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      }
    });
  } catch (error) {
    console.error(`Error deleting workspace ${workspaceName}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get workspace ID from workspace name
 */
async function getWorkspaceIdByName(workspaceName) {
  const workspaceUrl = `${TERRAFORM_CLOUD_API_URL}/organizations/${TERRAFORM_CLOUD_ORG_NAME}/workspaces/${workspaceName}`;
  const workspaceResponse = await axios.get(workspaceUrl, {
    headers: {
      'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
      'Content-Type': 'application/vnd.api+json'
    }
  });
  return workspaceResponse.data.data.id;
}

/**
 * Get workspace ID from run ID
 */
async function getWorkspaceFromRun(runId) {
  const runResponse = await axios.get(
    `${TERRAFORM_CLOUD_API_URL}/runs/${runId}`,
    {
      headers: {
        'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }
  );
  return runResponse.data.data.relationships.workspace.data.id;
}

/**
 * Get workspace name from workspace ID
 */
async function getWorkspaceName(workspaceId) {
  const workspaceResponse = await axios.get(
    `${TERRAFORM_CLOUD_API_URL}/workspaces/${workspaceId}`,
    {
      headers: {
        'Authorization': `Bearer ${TERRAFORM_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }
  );
  return workspaceResponse.data.data.attributes.name;
}

module.exports = {
  getOAuthTokenId,
  createWorkspace,
  triggerTerraformRun,
  getRunStatus,
  triggerDestroyRun,
  deleteWorkspace,
  getWorkspaceIdByName,
  getWorkspaceFromRun,
  getWorkspaceName
};
