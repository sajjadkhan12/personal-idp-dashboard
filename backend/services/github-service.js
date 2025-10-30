const axios = require('axios');
const config = require('../config');

const { 
  GITHUB_PERSONAL_TOKEN,
  GITHUB_ORG_NAME,
  TEMPLATE_REPO_OWNER,
  TEMPLATE_REPO_NAME,
  TEMPLATE_BRANCH
} = config;

/**
 * Fetch files from GitHub repository
 */
async function fetchFilesFromGitHub(owner, repo, path, branch = 'main') {
  const token = GITHUB_PERSONAL_TOKEN || process.env.GITHUB_TOKEN;
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  console.log(`Fetching from: ${url}`);
  
  try {
    const response = await axios.get(
      url,
      { headers: { 'Accept': 'application/vnd.github.v3+json', ...authHeaders } }
    );
    
    const files = [];
    
    for (const item of response.data) {
      if (item.type === 'file') {
        const fileResponse = await axios.get(item.url, { headers: authHeaders });
        files.push({
          path: item.path,
          content: fileResponse.data.content,
          sha: item.sha
        });
      } else if (item.type === 'dir') {
        const subFiles = await fetchFilesFromGitHub(owner, repo, item.path, branch);
        files.push(...subFiles);
      }
    }
    
    return files;
  } catch (error) {
    console.error(`Error fetching files from GitHub (${url}): ${error.message}`);
    console.error(`Response status: ${error.response?.status}`);
    console.error(`Response data:`, error.response?.data);
    throw new Error(`Failed to fetch template from GitHub: ${error.message}`);
  }
}

/**
 * Create GitHub repository from template
 */
async function createGitHubRepoFromTemplate(user, repoName, description, templateSource) {
  const personalToken = GITHUB_PERSONAL_TOKEN || process.env.GITHUB_TOKEN;
  
  if (!personalToken) {
    throw new Error('GITHUB_PERSONAL_TOKEN is not set in environment variables');
  }

  // Step 1: Create the repository in organization
  let repoUrl;
  
  try {
    const createRepoResponse = await axios.post(
      `https://api.github.com/orgs/${GITHUB_ORG_NAME}/repos`,
      {
        name: repoName,
        description: description || 'Created from IDP template',
        private: false,
        auto_init: false
      },
      {
        headers: {
          'Authorization': `Bearer ${personalToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );
    
    repoUrl = createRepoResponse.data.html_url;
    console.log(`Repository created: ${createRepoResponse.data.full_name}`);
  } catch (error) {
    console.error('Error creating repository:', error.response?.data || error.message);
    throw new Error(`Failed to create repository in organization: ${error.response?.data?.message || error.message}`);
  }

  // Step 2: Fetch template files from GitHub (including .github/workflows)
  try {
    // Fetch from the template service folder (e.g., python-service)
    let templateFiles = await fetchFilesFromGitHub(
      TEMPLATE_REPO_OWNER, 
      TEMPLATE_REPO_NAME, 
      templateSource,
      TEMPLATE_BRANCH
    );
    
    const allFiles = [...templateFiles];
    
    console.log(`Total files fetched: ${allFiles.length}`);
    console.log(`Files to copy:`, allFiles.map(f => f.path).join(', '));
    
    // Step 3: Upload files to the new repository
    for (const file of allFiles) {
      // Skip .git directory but keep .github directory!
      // Check for /.git/ (directory) or /.git$ (end of path) to avoid matching .github or .gitignore
      if (file.path.match(/\/\.git\//) || file.path.match(/\/\.git$/) || file.path.includes('node_modules')) {
        console.log(`SKIPPING: ${file.path} (matches /.git/ directory)`);
        continue;
      }
      
      try {
        // For files inside python-service/, remove the python-service/ prefix
        let filePathForRepo = file.path;
        if (file.path.startsWith(`${templateSource}/`)) {
          filePathForRepo = file.path.substring(templateSource.length + 1);
        }
        
        // Skip empty paths or the template folder itself
        if (!filePathForRepo || filePathForRepo === '' || filePathForRepo === '/') {
          continue;
        }
        
        console.log(`Copying file: ${file.path} -> ${filePathForRepo}`);
        
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
          // File doesn't exist yet
        }
        
        const payload = {
          message: sha ? `Update ${filePathForRepo}` : `Add ${filePathForRepo}`,
          content: file.content,
          committer: {
            name: 'IDP Service',
            email: 'noreply@idp.com'
          }
        };
        
        if (sha) {
          payload.sha = sha;
        }
        
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
      } catch (fileError) {
        console.error(`Error creating file ${file.path}:`, fileError.response?.data || fileError.message);
      }
    }
  } catch (error) {
    console.error('Error fetching template from GitHub:', error);
    throw new Error(`Failed to fetch template from GitHub: ${error.message}`);
  }
  
  return repoUrl;
}

/**
 * Delete GitHub repository
 */
async function deleteGitHubRepository(owner, repo) {
  const personalToken = GITHUB_PERSONAL_TOKEN || process.env.GITHUB_TOKEN;
  
  if (!personalToken) {
    throw new Error('GITHUB_PERSONAL_TOKEN is not set in environment variables');
  }

  try {
    await axios.delete(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${personalToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    console.log(`Successfully deleted GitHub repository: ${owner}/${repo}`);
  } catch (error) {
    console.error('Error deleting repository:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  fetchFilesFromGitHub,
  createGitHubRepoFromTemplate,
  deleteGitHubRepository
};
