// Service configuration for Terraform Cloud workspaces
const SERVICE_CONFIG = {
  'gcp-bucket': {
    workingDir: 'terraform-configs/gcp-bucket',
    description: 'GCP Storage Bucket',
    variables: ['project_id', 'bucket_name', 'region'],
    githubUrl: (projectId, name) => `https://console.cloud.google.com/storage/browser/${name}?project=${projectId}`
  },
  'gcp-k8s': {
    workingDir: 'terraform-configs/gcp-k8s',
    description: 'GCP Kubernetes Cluster',
    variables: ['project_id', 'cluster_name', 'region', 'node_count', 'machine_type'],
    githubUrl: (projectId) => `https://console.cloud.google.com/kubernetes/cluster/list?project=${projectId}`
  },
  'aws-s3': {
    workingDir: 'terraform-configs/aws-s3',
    description: 'AWS S3 Bucket',
    variables: ['bucket_name', 'region', 'versioning'],
    githubUrl: (region) => `https://s3.console.aws.amazon.com/s3/home?region=${region}`
  },
  'aws-ec2': {
    workingDir: 'terraform-configs/aws-ec2',
    description: 'AWS EC2 Instance',
    variables: ['instance_name', 'instance_type', 'region', 'ami_id'],
    githubUrl: (region) => `https://${region}.console.aws.amazon.com/ec2/v2/home?region=${region}#Instances:`
  }
};

module.exports = SERVICE_CONFIG;
