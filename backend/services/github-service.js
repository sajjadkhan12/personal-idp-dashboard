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
  
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
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
    console.error(`Error fetching files from GitHub: ${error.message}`);
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

  // Step 1: Create the repository
  let repoUrl;
  
  try {
    const createRepoResponse = await axios.post(
      `https://api.github.com/orgs/${GITHUB_ORG_NAME}/repos`,
      {
        name: repoName,
        description: description || 'Created from IDP template',
        private: false,
        auto_init: true
      },
      {
        headers: {
          'Authorization': `Bearer ${personalToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    repoUrl = createRepoResponse.data.html_url;
  } catch (error) {
    console.error('Error creating organization repo, trying user repo:', error.response?.data);
    
    try {
      const createRepoResponse = await axios.post(
        'https://api.github.com/user/repos',
        {
          name: repoName,
          description: description || 'Created from IDP template',
          private: false,
          auto_init: true
        },
        {
          headers: {
            'Authorization': `Bearer ${personalToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      repoUrl = createRepoResponse.data.html_url;
    } catch (fallbackError) {
      console.error('Error creating GitHub repository:', fallbackError.response?.data);
      throw new Error('Failed to create GitHub repository');
    }
  }

  // Step 2: Fetch template files from GitHub
  try {
    const templateFiles = await fetchFilesFromGitHub(
      TEMPLATE_REPO_OWNER, 
      TEMPLATE_REPO_NAME, 
      templateSource,
      TEMPLATE_BRANCH
    );
    
    // Step 3: Upload files to the new repository
    for (const file of templateFiles) {
      if (file.path.includes('.git') || file.path.includes('node_modules')) {
        continue;
      }
      
      try {
        const base64Content = file.content;
        
        const pathParts = file.path.split('/');
        const filePathForRepo = pathParts[pathParts.length - 1];
        
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
          message: sha ? `Update ${filePathForRepo} from template` : `Add ${filePathForRepo} from template`,
          content: base64Content,
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
