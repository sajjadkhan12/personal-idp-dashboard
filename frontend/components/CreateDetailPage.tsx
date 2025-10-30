import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { SoftwareTemplate } from '../types';
import CreateServiceModal from './CreateServiceModal';

interface CreateDetailPageProps {
  template: SoftwareTemplate;
  onBack: () => void;
  onCreationSuccess: () => void;
}

const CreateDetailPage: React.FC<CreateDetailPageProps> = ({ template, onBack, onCreationSuccess }) => {
  const router = useRouter();
  
  // State for Software Component
  const [componentName, setComponentName] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [owner, setOwner] = useState('engineering-team');

  // State for GCP Bucket
  const [projectId, setProjectId] = useState('');
  const [bucketName, setBucketName] = useState('');
  const [location, setLocation] = useState('US');
  const [storageClass, setStorageClass] = useState('STANDARD');
  const [versioningEnabled, setVersioningEnabled] = useState(false);
  const [bucketEnvironment, setBucketEnvironment] = useState('dev'); // dev, stg, prod

  // State for GCP K8s Cluster
  const [clusterName, setClusterName] = useState('');
  const [k8sRegion, setK8sRegion] = useState('us-central1');
  const [nodeCount, setNodeCount] = useState('3');
  const [machineType, setMachineType] = useState('e2-medium');
  const [k8sEnvironment, setK8sEnvironment] = useState('dev'); // dev, stg, prod

  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  
  // Get GitHub org name from environment variable or use default
  const githubOrg = process.env.NEXT_PUBLIC_GITHUB_ORG_NAME || 'sajjadkhan-academy';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreationStatus('loading');
    setError(null);

    let endpoint = '/api/components';
    let body = {};

    if (template.id === 'gcp-storage-bucket') {
      endpoint = '/api/provision/gcp-bucket';
      body = {
        projectId,
        bucketName,
        location,
        storageClass,
        versioningEnabled,
        environment: bucketEnvironment,
      };
    } else if (template.id === 'k8s-cluster') {
      endpoint = '/api/provision/gcp-k8s';
      body = {
        projectId,
        clusterName,
        region: k8sRegion,
        nodeCount: parseInt(nodeCount),
        machineType,
        environment: k8sEnvironment,
      };
    } else {
      body = {
        name: componentName,
        description,
        owner,
        githubUrl: `https://github.com/${githubOrg}/${githubRepo}`,
        templateId: template.id,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create component');
      }
      
      const data = await response.json();
      
      // For GCP infrastructure, show quick notification and redirect to catalog
      if ((template.id === 'gcp-storage-bucket' || template.id === 'k8s-cluster') && data.runId) {
        setIsCreating(false);
        const serviceName = template.id === 'gcp-storage-bucket' ? 'GCP Bucket' : 'K8s Cluster';
        toast.success(`${serviceName} provisioning initiated!`);
        // Show success message and redirect to catalog
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        // For other components, show success immediately
        toast.success(`${componentName} created successfully!`);
        setCreationStatus('success');
        setIsCreating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setCreationStatus('error');
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (template.id !== 'gcp-storage-bucket' && template.id !== 'k8s-cluster') {
      const repoName = componentName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setGithubRepo(repoName);
    }
  }, [componentName, template.id]);


  const renderGcpBucketForm = () => (
    <form onSubmit={handleCreate}>
      <div className="space-y-6">
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-slate-700">Project ID</label>
          <input type="text" id="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., my-gcp-project" required />
        </div>
        <div>
          <label htmlFor="bucketName" className="block text-sm font-medium text-slate-700">Bucket Name</label>
          <input type="text" id="bucketName" value={bucketName} onChange={(e) => setBucketName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., my-awesome-bucket" required />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-700">Location</label>
          <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option>US</option>
            <option>EU</option>
            <option>ASIA</option>
          </select>
        </div>
        <div>
          <label htmlFor="storageClass" className="block text-sm font-medium text-slate-700">Storage Class</label>
          <select id="storageClass" value={storageClass} onChange={(e) => setStorageClass(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option>STANDARD</option>
            <option>NEARLINE</option>
            <option>COLDLINE</option>
            <option>ARCHIVE</option>
          </select>
        </div>
        <div>
          <label htmlFor="bucketEnvironment" className="block text-sm font-medium text-slate-700">Environment</label>
          <select id="bucketEnvironment" value={bucketEnvironment} onChange={(e) => setBucketEnvironment(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="dev">Development</option>
            <option value="stg">Staging</option>
            <option value="prod">Production</option>
          </select>
        </div>
        <div className="flex items-center">
          <input id="versioningEnabled" type="checkbox" checked={versioningEnabled} onChange={(e) => setVersioningEnabled(e.target.checked)} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
          <label htmlFor="versioningEnabled" className="ml-2 block text-sm text-slate-900">Enable Versioning</label>
        </div>
      </div>
      <div className="mt-8 pt-5 border-t border-slate-200">
        <div className="flex justify-end">
          <button type="button" onClick={onBack} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
          <button type="submit" disabled={isCreating} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {isCreating ? 'Creating...' : 'Create Bucket'}
          </button>
        </div>
      </div>
    </form>
  );

  const renderGcpK8sForm = () => (
    <form onSubmit={handleCreate}>
      <div className="space-y-6">
        <div>
          <label htmlFor="k8sProjectId" className="block text-sm font-medium text-slate-700">Project ID</label>
          <input type="text" id="k8sProjectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., my-gcp-project" required />
        </div>
        <div>
          <label htmlFor="clusterName" className="block text-sm font-medium text-slate-700">Cluster Name</label>
          <input type="text" id="clusterName" value={clusterName} onChange={(e) => setClusterName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., my-production-cluster" required />
        </div>
        <div>
          <label htmlFor="k8sRegion" className="block text-sm font-medium text-slate-700">Region</label>
          <select id="k8sRegion" value={k8sRegion} onChange={(e) => setK8sRegion(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="us-central1">us-central1 (Iowa)</option>
            <option value="us-east1">us-east1 (South Carolina)</option>
            <option value="us-west1">us-west1 (Oregon)</option>
            <option value="europe-west1">europe-west1 (Belgium)</option>
            <option value="asia-east1">asia-east1 (Taiwan)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="nodeCount" className="block text-sm font-medium text-slate-700">Node Count</label>
            <input type="number" id="nodeCount" value={nodeCount} onChange={(e) => setNodeCount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="3" min="1" max="100" required />
          </div>
          <div>
            <label htmlFor="machineType" className="block text-sm font-medium text-slate-700">Machine Type</label>
            <select id="machineType" value={machineType} onChange={(e) => setMachineType(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value="e2-small">e2-small (2 vCPU, 2 GB)</option>
              <option value="e2-medium">e2-medium (2 vCPU, 4 GB)</option>
              <option value="e2-standard-2">e2-standard-2 (2 vCPU, 8 GB)</option>
              <option value="e2-standard-4">e2-standard-4 (4 vCPU, 16 GB)</option>
              <option value="e2-standard-8">e2-standard-8 (8 vCPU, 32 GB)</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="k8sEnvironment" className="block text-sm font-medium text-slate-700">Environment</label>
          <select id="k8sEnvironment" value={k8sEnvironment} onChange={(e) => setK8sEnvironment(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="dev">Development</option>
            <option value="stg">Staging</option>
            <option value="prod">Production</option>
          </select>
        </div>
      </div>
      <div className="mt-8 pt-5 border-t border-slate-200">
        <div className="flex justify-end">
          <button type="button" onClick={onBack} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
          <button type="submit" disabled={isCreating} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {isCreating ? 'Provisioning...' : 'Provision Cluster'}
          </button>
        </div>
      </div>
    </form>
  );

  const renderServiceInfo = () => {
    const infoMap: Record<string, { title: string; description: string; requirements: string[]; benefits: string[] }> = {
      'gcp-storage-bucket': {
        title: 'GCP Storage Bucket',
        description: 'Google Cloud Storage provides a highly durable and scalable object storage service. Buckets are containers for storing your data in Google Cloud Platform.',
        requirements: [
          'A valid GCP project with billing enabled',
          'Appropriate IAM permissions to create storage buckets',
          'Unique bucket name (globally unique across all projects)',
          'Terraform Cloud configured with GCP credentials'
        ],
        benefits: [
          '99.999999999% (11 9\'s) durability',
          'Automatic scaling without capacity planning',
          'Multiple storage classes for cost optimization',
          'Versioning support for data protection',
          'Global CDN integration available'
        ]
      },
      'python-service': {
        title: 'Python FastAPI Service',
        description: 'A Python-based microservice template ready for deployment using FastAPI. Includes Docker support, API documentation, and production-ready configuration.',
        requirements: [
          'GitHub account with appropriate permissions',
          'Python 3.11+ runtime environment',
          'Docker (optional, for containerization)',
          'FastAPI dependencies installed'
        ],
        benefits: [
          'FastAPI framework for high performance',
          'Built-in API documentation at /docs',
          'Automatic request/response validation',
          'Docker support for easy deployment',
          'Easy to extend and customize'
        ]
      },
      'nodejs-service': {
        title: 'Node.js Application',
        description: 'A Node.js microservice template with Express. Perfect for building RESTful APIs and lightweight backend services.',
        requirements: [
          'GitHub repository for source code',
          'Node.js 14+ runtime environment',
          'npm or yarn package manager',
          'Environment variables configured'
        ],
        benefits: [
          'Non-blocking I/O for high performance',
          'Rich ecosystem of npm packages',
          'Built-in JSON support',
          'Real-time capabilities with WebSockets',
          'Excellent community support'
        ]
      },
      'go-service': {
        title: 'Go Application',
        description: 'A Go microservice template with Gin framework. Ideal for high-performance services that require low latency and minimal resource usage.',
        requirements: [
          'GitHub repository for source code',
          'Go 1.16+ runtime environment',
          'Go modules configured',
          'Linux/Unix compatible deployment target'
        ],
        benefits: [
          'Fast compilation and execution',
          'Low memory footprint',
          'Built-in concurrency support',
          'Single binary deployment',
          'Excellent performance for concurrent workloads'
        ]
      },
      'react-webapp': {
        title: 'React Application',
        description: 'A React frontend application template with modern tooling. Includes TypeScript, Vite, and Tailwind CSS for rapid development.',
        requirements: [
          'GitHub repository for source code',
          'Node.js 16+ for build process',
          'Modern browser support',
          'API endpoints configured'
        ],
        benefits: [
          'Component-based architecture',
          'Virtual DOM for performance',
          'Rich ecosystem of libraries',
          'TypeScript for type safety',
          'Hot module replacement for fast development'
        ]
      },
      'aws-s3-bucket': {
        title: 'AWS S3 Bucket',
        description: 'Amazon Simple Storage Service (S3) provides scalable object storage with industry-leading durability and availability.',
        requirements: [
          'AWS account with appropriate permissions',
          'Valid AWS region selected',
          'Unique bucket name (globally unique)',
          'Terraform Cloud configured with AWS credentials'
        ],
        benefits: [
          '99.999999999% (11 9\'s) durability',
          'Pay-as-you-go pricing model',
          'Lifecycle policies for cost management',
          'Integration with other AWS services',
          'Multiple storage classes available'
        ]
      },
      'k8s-cluster': {
        title: 'GCP Kubernetes Cluster',
        description: 'Deploy a managed Kubernetes cluster on Google Kubernetes Engine (GKE). Get a production-ready Kubernetes cluster with automatic management and scaling.',
        requirements: [
          'A valid GCP project with billing enabled',
          'Kubernetes Engine API enabled',
          'Appropriate IAM permissions',
          'Terraform Cloud configured with GCP credentials'
        ],
        benefits: [
          'Fully managed Kubernetes control plane',
          'Automatic node upgrades and patching',
          'Integrated with Google Cloud services',
          'High availability and scalability',
          'Built-in logging and monitoring'
        ]
      }
    };

    const info = infoMap[template.id] || {
      title: template.name,
      description: template.description,
      requirements: ['Basic configuration'],
      benefits: ['Ready to deploy']
    };

    return (
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{info.title}</h2>
        <p className="text-slate-600 mb-6">{info.description}</p>
        
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Requirements
          </h3>
          <ul className="space-y-2">
            {info.requirements.map((req, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Benefits
          </h3>
          <ul className="space-y-2">
            {info.benefits.map((benefit, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderDefaultForm = () => (
    <form onSubmit={handleCreate}>
      <div className="space-y-6">
        <div>
          <label htmlFor="componentName" className="block text-sm font-medium text-slate-700">Component Name</label>
          <input type="text" id="componentName" value={componentName} onChange={(e) => setComponentName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., User Authentication Service" required />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="A short description of what this component does." required></textarea>
        </div>
        <div>
          <label htmlFor="owner" className="block text-sm font-medium text-slate-700">Owner</label>
          <select id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option>engineering-team</option>
            <option>product-team</option>
            <option>data-science</option>
          </select>
        </div>
        <div>
          <label htmlFor="githubRepo" className="block text-sm font-medium text-slate-700">GitHub Repository Name</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">github.com/{githubOrg}/</span>
            <input type="text" id="githubRepo" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-slate-300" placeholder="repo-name" required />
          </div>
        </div>
      </div>
      <div className="mt-8 pt-5 border-t border-slate-200">
        <div className="flex justify-end">
          <button type="button" onClick={onBack} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
          <button type="submit" disabled={isCreating} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {isCreating ? 'Creating...' : 'Create Component'}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <>
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <button onClick={onBack} className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 flex items-center">
            &larr; Back to templates
          </button>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side - Form */}
            <div className="flex-1">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center mb-6">
                  {template.icon}
                  <h1 className="ml-4 text-2xl font-bold text-slate-800">Create a new {template.name}</h1>
                </div>
                {template.id === 'gcp-storage-bucket' ? renderGcpBucketForm() : 
                 template.id === 'k8s-cluster' ? renderGcpK8sForm() : 
                 renderDefaultForm()}
              </div>
            </div>

            {/* Right Side - Service Info */}
            <div className="w-full lg:w-96 flex-shrink-0">
              {renderServiceInfo()}
            </div>
          </div>
        </div>
      </div>
      {(creationStatus !== 'idle' && template.id !== 'gcp-storage-bucket' && template.id !== 'k8s-cluster') && (
        <CreateServiceModal status={creationStatus} onDone={onCreationSuccess} error={error} />
      )}
    </>
  );
};

export default CreateDetailPage;
