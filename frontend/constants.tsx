import React from 'react';

// FIX: Implement icon components.
export const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

export const GithubIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

export const SearchIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
  
export const PortalIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
);

export const CreateIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const CatalogIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </svg>
);

export const HelpIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);

export const PythonIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.25 8.5V4.333C11.25 3.424 10.576 1 8.5 1S5.75 3.424 5.75 4.333V9.625C5.75 10.385 6 12.062 6.875 12.062H11.25M11.25 8.5H16.125C17.062 8.5 19 8.229 19 6.375S17.062 4.25 16.125 4.25H12.375M12.75 15.5V19.667C12.75 20.576 13.424 23 15.5 23S18.25 20.576 18.25 19.667V14.375C18.25 13.615 18 11.938 17.125 11.938H12.75M12.75 15.5H7.875C6.938 15.5 5 15.771 5 17.625S6.938 19.75 7.875 19.75H11.625" stroke="#3776AB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
export const NodeJSIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#8CC84B"/><path d="M10.9571 18.5V11.8214L7.5 13.5V10.5L11.5357 8.5H12.4643V18.5H10.9571ZM15.2143 14.5357C15.9643 14.1786 16.5 13.5357 16.5 12.6786C16.5 11.5357 15.6071 10.75 14.3571 10.75H13.25V13.0714H14.1786C14.7143 13.0714 15.0357 13.25 15.0357 13.6786C15.0357 14.0714 14.75 14.2857 14.25 14.2857H13.8571L14.4286 15.5H13.25V16.5H15.6429L16.25 15.1786L15.2143 14.5357Z" fill="white"/></svg>
);
export const GoIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#00ADD8"/><path d="M14.5 15H17.5V12.5H14.5V10H12V15H14.5ZM8 9H10.5C11.6046 9 12.5 9.89543 12.5 11C12.5 12.1046 11.6046 13 10.5 13H8V9ZM10.5 11.5H9.5V10.5H10.5C10.7761 10.5 11 10.7239 11 11C11 11.2761 10.7761 11.5 10.5 11.5Z" fill="white"/></svg>
);
export const WebAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#61DAFB"/><path d="M12 5.5L17.5 9.5L15.5 16.5H8.5L6.5 9.5L12 5.5Z" fill="white"/><path d="M12 10.5L14 12.5L11 16.5H13L15.5 12L12 9.5V10.5Z" fill="#61DAFB"/></svg>
);

export const AWSS3Icon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 9.54V14.46C22 17.75 20 19.31 16 19.31H8C4 19.31 2 17.75 2 14.46V9.54C2 6.25 4 4.69 8 4.69H16C20 4.69 22 6.25 22 9.54Z" stroke="#F79B34" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M2 9.99805H22" stroke="#F79B34" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
);

export const GCPBucketIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L5 6V18L12 22L19 18V6L12 2Z" fill="#4285F4"/>
        <path d="M12 18V12L19 8V14L12 18Z" fill="#1A73E8"/>
        <path d="M12 12V18L5 14V8L12 12Z" fill="#B3D1FF"/>
        <path d="M12 12L5 8L12 4L19 8L12 12Z" fill="white"/>
    </svg>
);

export const K8sIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="#326CE5" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="2.5" fill="#326CE5" />
      <line x1="12" y1="6" x2="12" y2="2" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="12" x2="2" y2="12" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="7.05" y1="16.95" x2="4.22" y2="19.78" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="7.05" y1="7.05" x2="4.22" y2="4.22" stroke="#326CE5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);


export const SOCIAL_LOGINS = [
  {
    name: 'GitHub',
    icon: <GithubIcon />,
    bgColor: 'bg-slate-800',
    textColor: 'text-white hover:bg-slate-700',
  },
];

// FIX: Add software templates constant.
export const SOFTWARE_TEMPLATES = [
    {
      id: 'python-service',
      name: 'Python Service',
      description: 'A backend service written in Python using the Flask framework. Includes a Dockerfile.',
      icon: <PythonIcon className="w-10 h-10 text-[#3776AB]" />,
      tags: ['Backend', 'Python', 'API'],
      type: 'Service',
    },
    {
      id: 'nodejs-service',
      name: 'Node.js Service',
      description: 'A backend service using Node.js with Express. Ready for containerization.',
      icon: <NodeJSIcon className="w-10 h-10" />,
      tags: ['Backend', 'Node.js', 'API'],
      type: 'Service',
    },
    {
      id: 'go-service',
      name: 'Go Service',
      description: 'A high-performance backend service written in Go. Includes a Dockerfile for easy deployment.',
      icon: <GoIcon className="w-10 h-10" />,
      tags: ['Backend', 'Go', 'High-Performance'],
      type: 'Service',
    },
    {
      id: 'react-webapp',
      name: 'React Web App',
      description: 'A modern frontend application built with React and Vite. Includes CI/CD pipeline setup.',
      icon: <WebAppIcon className="w-10 h-10" />,
      tags: ['Frontend', 'React', 'WebApp'],
      type: 'Website',
    },
    {
      id: 'aws-s3-bucket',
      name: 'AWS S3 Bucket',
      description: 'Create a new S3 bucket for object storage in AWS. Fully configurable and ready for production use.',
      icon: <AWSS3Icon className="w-10 h-10" />,
      tags: ['Cloud', 'AWS', 'Storage', 'Infrastructure'],
      type: 'Infrastructure',
    },
    {
      id: 'gcp-storage-bucket',
      name: 'GCP Storage Bucket',
      description: 'Provision a new Cloud Storage bucket in Google Cloud Platform for scalable object storage.',
      icon: <GCPBucketIcon className="w-10 h-10" />,
      tags: ['Cloud', 'GCP', 'Storage', 'Infrastructure'],
      type: 'Infrastructure',
    },
    {
      id: 'k8s-cluster',
      name: 'Kubernetes Cluster',
      description: 'Deploy a new Kubernetes cluster on your preferred cloud provider for container orchestration.',
      icon: <K8sIcon className="w-10 h-10" />,
      tags: ['Container', 'Kubernetes', 'Orchestration', 'Infrastructure'],
      type: 'Infrastructure',
    },
];