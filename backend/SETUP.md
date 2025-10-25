# Backend Setup Instructions

## Environment Variables Required

Create a `.env` file in the `frontend/backend` directory with the following variables:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Terraform Cloud Configuration
TERRAFORM_CLOUD_API_TOKEN=your_terraform_cloud_api_token
TERRAFORM_CLOUD_ORG_NAME=your_organization_name
TERRAFORM_CLOUD_WORKSPACE_NAME=your_workspace_name
```

## Getting Terraform Cloud Credentials

1. **Get Terraform Cloud API Token**:
   - Go to https://app.terraform.io/app/settings/tokens
   - Create a new User Token
   - Copy the token and add it to your `.env` file

2. **Get Organization Name**:
   - Go to https://app.terraform.io/app/settings/organizations
   - Copy your organization name

3. **Get Workspace Name**:
   - Go to your Terraform Cloud workspace
   - Copy the workspace name from the URL or settings

## Updating Terraform Cloud Workspace Variables

Your Terraform Cloud workspace needs to accept these variables:
- `project_id` (string)
- `bucket_name` (string)
- `location` (string) - optional, defaults to 'US'
- `storage_class` (string) - optional, defaults to 'STANDARD'
- `versioning` (bool) - optional, defaults to false

## Starting the Backend Server

```bash
cd frontend/backend
npm install
node server.js
```

The server will run on http://localhost:4000

