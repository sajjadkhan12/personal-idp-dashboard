const express = require('express');
const axios = require('axios');
const router = express.Router();
const { components: componentDb } = require('../db-helpers');
const { requireAuth } = require('../middleware/auth');
const { getRunStatus, deleteWorkspace, getWorkspaceFromRun, getWorkspaceName } = require('../services/terraform-service');
const config = require('../config');

const TERRAFORM_CLOUD_API_URL = config.TERRAFORM_CLOUD_API_URL;
const TERRAFORM_CLOUD_ORG_NAME = config.TERRAFORM_CLOUD_ORG_NAME;
const TERRAFORM_CLOUD_API_TOKEN = config.TERRAFORM_CLOUD_API_TOKEN;

// GET run status
router.get('/runs/:runId/status', requireAuth, async (req, res) => {
  try {
    const { runId } = req.params;
    const runStatus = await getRunStatus(runId);
    
    // Update the database with the latest status
    const component = await componentDb.findAll();
    const componentsWithRun = component.find(c => c.terraformRunId === runId);
    
    if (componentsWithRun) {
      // If destroy completed successfully, delete the component from database
      if (runStatus.status === 'applied' && componentsWithRun.isDestroying) {
        // Delete the workspace after successful destroy
        if (componentsWithRun.workspaceName) {
          try {
            await deleteWorkspace(componentsWithRun.workspaceName);
          } catch (error) {
            console.error(`Error deleting workspace ${componentsWithRun.workspaceName}:`, error.response?.data || error.message);
          }
        } else {
          // Fallback: get workspace from run and delete it
          try {
            const workspaceId = await getWorkspaceFromRun(runId);
            const workspaceName = await getWorkspaceName(workspaceId);
            await deleteWorkspace(workspaceName);
          } catch (error) {
            console.error(`Error deleting workspace (fallback):`, error.response?.data || error.message);
          }
        }
        
        await componentDb.delete(componentsWithRun.id);
      } else {
        // Update status normally
        const updateData = {
          terraformStatus: runStatus.status,
          terraformError: runStatus.error || null
        };
        
        // If destroy failed (errored), clear the isDestroying flag
        if (runStatus.status === 'errored' && componentsWithRun.isDestroying) {
          updateData.isDestroying = false;
        }
        
        await componentDb.update(componentsWithRun.id, updateData);
      }
    }
    
    res.json(runStatus);
  } catch (error) {
    console.error('Error getting run status:', error);
    res.status(500).json({ error: 'Failed to get run status' });
  }
});

module.exports = router;

