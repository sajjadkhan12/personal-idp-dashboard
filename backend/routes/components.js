const express = require('express');
const router = express.Router();
const { components: componentDb } = require('../db-helpers');
const { requireAuth } = require('../middleware/auth');
const config = require('../config');
const { createGitHubRepoFromTemplate, deleteGitHubRepository } = require('../services/github-service');

const GITHUB_PERSONAL_TOKEN = config.GITHUB_PERSONAL_TOKEN;
const GITHUB_ORG_NAME = config.GITHUB_ORG_NAME;

// GET all components
router.get('/components', requireAuth, async (req, res) => {
  try {
    const components = await componentDb.findAll();
    res.json(components);
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

// POST create new component
router.post('/components', requireAuth, async (req, res) => {
  try {
    const { name, description, owner, githubUrl, templateId } = req.body;
    
    if (!name || !description || !owner) {
      return res.status(400).json({ error: 'Name, description, and owner are required' });
    }

    let finalGithubUrl = githubUrl;
    let targetRepoName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // If this is a Python service, create the repo from template
    if (templateId === 'python-service') {
      try {
        if (!GITHUB_PERSONAL_TOKEN) {
          console.error('GITHUB_PERSONAL_TOKEN is not set in environment variables');
          throw new Error('GITHUB_PERSONAL_TOKEN environment variable is required for creating repositories from templates');
        }
        
        if (githubUrl) {
          const match = githubUrl.match(/github\.com\/[^/]+\/([^/]+)/);
          if (match) {
            targetRepoName = match[1];
          }
        }
        
        const repoUrl = await createGitHubRepoFromTemplate(
          null,
          targetRepoName,
          description,
          'python-service'
        );
        
        finalGithubUrl = repoUrl;
      } catch (templateError) {
        console.error('Error creating service from template:', templateError);
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

    const component = await componentDb.create(newComponent);
    
    res.status(201).json(component);
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ 
      error: 'Failed to create component',
      details: error.message 
    });
  }
});

// DELETE component
router.delete('/components/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const component = await componentDb.findById(id);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Check if this is a Python service and delete GitHub repo
    if (component.type === 'Service' && component.githubRepoOwner && component.githubRepoName) {
      try {
        await deleteGitHubRepository(component.githubRepoOwner, component.githubRepoName);
      } catch (deleteError) {
        console.error('Error deleting GitHub repository:', deleteError.response?.data || deleteError.message);
      }
    }

    await componentDb.delete(id);
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// DELETE all components (for debugging)
router.delete('/components', requireAuth, async (req, res) => {
  try {
    const pool = require('../database');
    const result = await pool.query('DELETE FROM components');
    res.json({ message: `Deleted ${result.rowCount} components` });
  } catch (error) {
    console.error('Error deleting components:', error);
    res.status(500).json({ error: 'Failed to delete components' });
  }
});

module.exports = router;

