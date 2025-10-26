require('dotenv').config({ debug: true });

const config = {
  // Server
  PORT: process.env.PORT || 4000,
  SESSION_SECRET: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  
  // GitHub
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_ORG_NAME: process.env.GITHUB_ORG_NAME || 'sajjadkhan12',
  GITHUB_PERSONAL_TOKEN: process.env.GITHUB_PERSONAL_TOKEN,
  
  // Template Repository
  TEMPLATE_REPO_OWNER: 'sajjadkhan12',
  TEMPLATE_REPO_NAME: 'idp-templates',
  TEMPLATE_BRANCH: 'main',
  
  // Terraform Cloud
  TERRAFORM_CLOUD_API_TOKEN: process.env.TERRAFORM_CLOUD_API_TOKEN,
  TERRAFORM_CLOUD_ORG_NAME: process.env.TERRAFORM_CLOUD_ORG_NAME,
  TERRAFORM_CLOUD_REPO: process.env.TERRAFORM_CLOUD_REPO,
  TERRAFORM_CLOUD_BRANCH: process.env.TERRAFORM_CLOUD_BRANCH || 'main',
  TERRAFORM_CLOUD_WORKING_DIR: process.env.TERRAFORM_CLOUD_WORKING_DIR || 'terraform-configs',
  TERRAFORM_CLOUD_TF_VERSION: process.env.TERRAFORM_CLOUD_TF_VERSION || '1.6.0',
  TERRAFORM_CLOUD_OAUTH_TOKEN_ID: process.env.TERRAFORM_CLOUD_OAUTH_TOKEN_ID,
  TERRAFORM_CLOUD_API_URL: 'https://app.terraform.io/api/v2',
  
  // Frontend Origins
  FRONTEND_ORIGINS: ['http://localhost:3000', 'http://localhost:3001']
};

// Validate required environment variables
if (!config.GITHUB_CLIENT_ID || !config.GITHUB_CLIENT_SECRET) {
  console.error('Error: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in environment variables');
  process.exit(1);
}

if (!config.TERRAFORM_CLOUD_API_TOKEN || !config.TERRAFORM_CLOUD_ORG_NAME || !config.TERRAFORM_CLOUD_REPO) {
  console.warn('Warning: Terraform Cloud configuration is incomplete. Some features may not work.');
  console.warn('Please set TERRAFORM_CLOUD_API_TOKEN, TERRAFORM_CLOUD_ORG_NAME, and TERRAFORM_CLOUD_REPO');
}

module.exports = config;

