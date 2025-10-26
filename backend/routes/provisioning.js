const express = require('express');
const router = express.Router();
const { components: componentDb } = require('../db-helpers');
const { requireAuth } = require('../middleware/auth');
const { triggerTerraformRun, getRunStatus } = require('../services/terraform-service');
const SERVICE_CONFIG = require('../service-config');

// POST provision GCP K8s cluster
router.post('/provision/gcp-k8s', requireAuth, async (req, res) => {
  try {
    const { projectId, clusterName, region, nodeCount, machineType, environment } = req.body;
    
    if (!projectId || !clusterName || !region) {
      return res.status(400).json({ error: 'Project ID, cluster name, and region are required' });
    }

    const variables = {
      project_id: projectId,
      cluster_name: clusterName,
      region: region,
      node_count: nodeCount || 3,
      machine_type: machineType || 'e2-medium'
    };

    const { runId, workspaceId, workspaceName } = await triggerTerraformRun(variables, 'gcp-k8s');
    const runStatus = await getRunStatus(runId);

    const newComponent = {
      id: Date.now().toString(),
      name: clusterName,
      description: `GCP Kubernetes Cluster in ${projectId}`,
      owner: 'engineering-team',
      type: 'Infrastructure',
      lifecycle: environment === 'prod' ? 'Production' : environment === 'stg' ? 'Staging' : 'Development',
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

// POST provision GCP bucket
router.post('/provision/gcp-bucket', requireAuth, async (req, res) => {
  try {
    const { projectId, bucketName, location, storageClass, versioningEnabled, environment } = req.body;

    if (!projectId || !bucketName) {
      return res.status(400).json({ error: 'Project ID and bucket name are required' });
    }

    const variables = {
      project_id: projectId,
      bucket_name: bucketName,
      region: location || 'US'
    };

    const { runId, workspaceId, workspaceName } = await triggerTerraformRun(variables, 'gcp-bucket');
    const runStatus = await getRunStatus(runId);

    const newComponent = {
      id: Date.now().toString(),
      name: bucketName,
      description: `GCP Storage Bucket in ${projectId}`,
      owner: 'engineering-team',
      type: 'Infrastructure',
      lifecycle: environment === 'prod' ? 'Production' : environment === 'stg' ? 'Staging' : 'Development',
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
    res.status(500).json({ 
      error: error.message || 'Failed to provision GCP bucket',
      details: error.response?.data || error.message
    });
  }
});

// POST generic service provisioning
router.post('/provision/:serviceType', requireAuth, async (req, res) => {
  try {
    const { serviceType } = req.params;
    const variables = req.body;
    
    const serviceConfig = SERVICE_CONFIG[serviceType];
    if (!serviceConfig) {
      return res.status(400).json({ error: `Unknown service type: ${serviceType}` });
    }

    const missingVars = serviceConfig.variables.filter(varName => !variables[varName]);
    if (missingVars.length > 0) {
      return res.status(400).json({ 
        error: `Missing required variables: ${missingVars.join(', ')}` 
      });
    }

    const { runId, workspaceId, workspaceName } = await triggerTerraformRun(variables, serviceType);
    const runStatus = await getRunStatus(runId);

    const githubUrl = serviceConfig.githubUrl(
      variables.project_id || variables.region, 
      variables.bucket_name || variables.cluster_name || variables.instance_name
    );

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

module.exports = router;

