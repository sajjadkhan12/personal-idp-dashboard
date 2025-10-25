# PostgreSQL Database Setup

This guide will help you set up PostgreSQL for the IDP Dashboard backend.

## Prerequisites

- PostgreSQL installed and running on your system
- Node.js and npm installed

## Setup Steps

### 1. Create the Database

Connect to PostgreSQL and create a new database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE idp_dashboard;

# Exit psql
\q
```

### 2. Configure Environment Variables

Update your `.env` file in the `frontend/backend` directory with PostgreSQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=idp_dashboard
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Other existing variables...
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
TERRAFORM_CLOUD_API_TOKEN=your_terraform_token
TERRAFORM_CLOUD_ORG_NAME=your_org_name
TERRAFORM_CLOUD_WORKSPACE_NAME=your_workspace_name
```

### 3. Initialize the Database Schema

Run the initialization script to create tables:

```bash
cd frontend/backend
npm run init-db
```

This will create the following tables:
- `users` - Store GitHub user information
- `components` - Store software components

### 4. Start the Server

```bash
npm start
```

The server will now use PostgreSQL instead of the file-based database (db.json).

## Database Schema

### Users Table
- `id` (BIGINT PRIMARY KEY) - GitHub user ID
- `login` (VARCHAR) - GitHub username
- `name` (VARCHAR) - User's full name
- `email` (VARCHAR) - User's email
- `avatar_url` (TEXT) - GitHub avatar URL
- `access_token` (TEXT) - GitHub OAuth token
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

### Components Table
- `id` (VARCHAR PRIMARY KEY) - Component ID
- `name` (VARCHAR) - Component name
- `description` (TEXT) - Component description
- `owner` (VARCHAR) - Owner team
- `type` (VARCHAR) - Component type (Service, Website, Infrastructure)
- `lifecycle` (VARCHAR) - Lifecycle stage
- `github_url` (TEXT) - GitHub repository URL
- `terraform_run_id` (VARCHAR) - Terraform Cloud run ID
- `terraform_status` (VARCHAR) - Terraform run status
- `terraform_error` (TEXT) - Error message if any
- `is_destroying` (BOOLEAN) - Whether destruction is in progress
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

## Troubleshooting

### Connection Error
If you get a connection error, verify:
1. PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
2. Database exists: `psql -U postgres -l`
3. Credentials in `.env` are correct

### Permission Error
If you get permission errors:
```bash
# Grant necessary permissions
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE idp_dashboard TO postgres;
\q
```

### Reset Database
To reset the database (warning: deletes all data):
```bash
psql -U postgres -c "DROP DATABASE idp_dashboard;"
psql -U postgres -c "CREATE DATABASE idp_dashboard;"
npm run init-db
```

## Migration from File-Based Database

If you have existing data in `db.json`:
1. The old file-based database will no longer be used
2. You'll need to re-login via GitHub to create users
3. Components will need to be recreated

## Notes

- The old `db.json` file is no longer used
- All database operations are now asynchronous
- The database connection pool is managed automatically

