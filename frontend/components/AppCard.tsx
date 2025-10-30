import React from 'react';
import { useRouter } from 'next/router';
import { SoftwareComponent, User } from '../types';

interface AppCardProps {
    component: SoftwareComponent;
    onDeleteClick: () => void;
    user: User;
    isDeleting?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({ component, onDeleteClick, user, isDeleting = false }) => {
    const router = useRouter();

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        router.push(`/component/${component.id}`);
    };

    const getStatusBadge = () => {
        if (!component.terraformStatus) return null;

        if (component.isDestroying) {
            return (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 capitalize">
                    Destroying
                </span>
            );
        }

        const statusConfig: Record<string, { bg: string; text: string }> = {
            'pending': { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400' },
            'plan_queued': { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400' },
            'planning': { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
            'planned': { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
            'apply_queued': { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400' },
            'applying': { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400' },
            'applied': { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400' },
            'errored': { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' },
        };

        const config = statusConfig[component.terraformStatus] || { bg: 'bg-gray-100 dark:bg-gray-900/50', text: 'text-gray-600 dark:text-gray-400' };
        
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} capitalize`}>
                {component.terraformStatus === 'applied' ? 'ACTIVE' : component.terraformStatus}
            </span>
        );
    };

    const getStatusIcon = () => {
        if (component.terraformStatus === 'applied') {
            return (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            );
        }

        if (['planning', 'applying'].includes(component.terraformStatus)) {
            return (
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        }

        return null;
    };

    const isGCPBucket = component.type === 'Infrastructure' && component.githubUrl.includes('console.cloud.google.com');
    const isGitHubLink = component.githubUrl.includes('github.com');

    return (
        <div 
            className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex items-center space-x-4 cursor-pointer border border-lt-base-300 dark:border-base-300"
            onClick={handleCardClick}
        >
            {/* Status Icon */}
            <div className="flex-shrink-0">
                {getStatusIcon()}
            </div>

            {/* Middle - Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-lt-content-strong dark:text-white truncate mb-1">{component.name}</h3>
                        <p className="text-sm text-lt-content-subtle dark:text-gray-400">Owned by {component.owner}</p>
                        <p className="text-sm text-lt-content-subtle dark:text-gray-400 mt-1 line-clamp-1">{component.description}</p>
                    </div>
                </div>
                
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        {component.type}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                        {component.lifecycle}
                    </span>
                    {getStatusBadge()}
                </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex-shrink-0 flex flex-col gap-2">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick();
                    }}
                    disabled={isDeleting || component.isDestroying}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors duration-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {(isDeleting || component.isDestroying) ? (
                        <>
                            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Destroying...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Destroy
                        </>
                    )}
                </button>
                <a 
                    href={component.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors whitespace-nowrap"
                >
                    {isGCPBucket ? (
                        <>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            View in GCP
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            View on GitHub
                        </>
                    )}
                </a>
            </div>
        </div>
    );
};

export default AppCard;
