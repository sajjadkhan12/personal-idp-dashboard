-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  login VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  access_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create components table
CREATE TABLE IF NOT EXISTS components (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  lifecycle VARCHAR(100) NOT NULL,
  github_url TEXT,
  github_repo_owner VARCHAR(255),
  github_repo_name VARCHAR(255),
  terraform_run_id VARCHAR(255),
  terraform_status VARCHAR(100),
  terraform_error TEXT,
  is_destroying BOOLEAN DEFAULT FALSE,
  workspace_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_owner ON components(owner);
CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);
CREATE INDEX IF NOT EXISTS idx_components_terraform_status ON components(terraform_status);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);

