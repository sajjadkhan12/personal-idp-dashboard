const express = require('express');
const router = express.Router();
const axios = require('axios');
const { components: componentDb } = require('../db-helpers');
const { requireAuth } = require('../middleware/auth');
const config = require('../config');
const { 
  triggerDestroyRun, 
  getWorkspaceIdByName, 
  getWorkspaceFromRun, 
  getWorkspaceName 
} = require('../services/terraform-service');
const { deleteGitHubRepository } = require('../services/github-service');

const GITHUB_PERSONAL_TOKEN = config.GITHUB_PERSONAL_TOKEN;
const TERRAFORM_CLOUD_API_URL = config.TERRAFORM_CLOUD_API_URL;
const TERRAFORM_CLOUD_ORG_NAME = config.TERRAFORM_CLOUD_ORG_NAME;
const TERRAFORM_CLOUD_API_TOKEN = config.TERRAFORM_CLOUD_API_TOKEN;

// POST destroy infrastructure
router.post('/components/:id/destroy', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const component = await componentDb.findById(id);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // If component has a Terraform run ID, trigger destroy
    if (component.terraformRunId) {
      try {
        let workspaceId;
        
        // Try to get workspace ID from component's workspace name first
        if (component.workspaceName) {
          workspaceId = await getWorkspaceIdByName(component.workspaceName);
        } else {
          // Fallback: get workspace ID from the run
          workspaceId = await getWorkspaceFromRun(component.terraformRunId);
          
          // Get workspace name for deletion later
          const workspaceName = await getWorkspaceName(workspaceId);
          
          // Update component with workspace name for future deletion
          await componentDb.update(component.id, { workspaceName });
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
        await deleteGitHubRepository(component.githubRepoOwner, component.githubRepoName);
      } catch (deleteError) {
        console.error('Error deleting GitHub repository:', deleteError.response?.data || deleteError.message);
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

module.exports = router;

