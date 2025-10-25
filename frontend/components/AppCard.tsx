// Fix: Implement the AppCard component.
import React from 'react';
import { useRouter } from 'next/router';
import { SoftwareComponent, User } from '../types';
import { PythonIcon } from '../constants';

interface AppCardProps {
    component: SoftwareComponent;
    onDeleteClick: () => void;
    user: User;
    isDeleting?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({ component, onDeleteClick, user, isDeleting = false }) => {
    const router = useRouter();
    const canDelete = user.role === 'admin';

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on delete button or external link
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        // Navigate to component detail page
        router.push(`/component/${component.id}`);
    };

    const getStatusBadge = () => {
        if (!component.terraformStatus) return null;

        const statusConfig: Record<string, { color: string; text: string; bg: string }> = {
            'pending': { color: 'text-yellow-800', text: 'Pending', bg: 'bg-yellow-100' },
            'plan_queued': { color: 'text-yellow-800', text: 'Plan Queued', bg: 'bg-yellow-100' },
            'planning': { color: 'text-blue-800', text: 'Planning', bg: 'bg-blue-100' },
            'planned': { color: 'text-blue-800', text: 'Planned', bg: 'bg-blue-100' },
            'apply_queued': { color: 'text-purple-800', text: 'Apply Queued', bg: 'bg-purple-100' },
            'applying': { color: 'text-purple-800', text: 'Applying', bg: 'bg-purple-100' },
            'applied': { color: 'text-green-800', text: 'Active', bg: 'bg-green-100' },
            'errored': { color: 'text-red-800', text: 'Failed', bg: 'bg-red-100' },
            'canceled': { color: 'text-gray-800', text: 'Canceled', bg: 'bg-gray-100' },
            'discarded': { color: 'text-gray-800', text: 'Discarded', bg: 'bg-gray-100' },
        };

        const config = statusConfig[component.terraformStatus] || { color: 'text-gray-800', text: component.terraformStatus, bg: 'bg-gray-100' };
        
        return (
            <span className={`inline-flex items-center px-2 py-0.5 ${config.bg} ${config.color} rounded-full font-semibold uppercase tracking-wide text-xs`}>
                {config.text}
            </span>
        );
    };

    const getStatusIcon = () => {
        if (!component.terraformStatus) return null;

        if (component.terraformStatus === 'applied') {
            return (
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            );
        }
        
        if (component.terraformStatus === 'errored' || component.terraformStatus === 'canceled') {
            return (
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            );
        }

        if (['planning', 'applying'].includes(component.terraformStatus)) {
            return (
                <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
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
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="flex">
                {/* Left Side - Icon */}
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 w-24 flex items-center justify-center">
                    {isGCPBucket ? (
                        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.41 18.31l-4.76-4.76c-.75-.75-1.97-.75-2.72 0s-.75 1.97 0 2.72l4.76 4.76c.37.37.85.62 1.36.69.51.07 1.03-.04 1.48-.31.45-.27.81-.67 1.03-1.17.22-.5.28-1.04.09-1.57-.19-.53-.53-.99-.98-1.36z"/>
                            <path d="M2 2v20h20V2H2zm18 18H4V4h16v16z"/>
                        </svg>
                    ) : (
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    )}
                </div>

                {/* Middle - Content */}
                <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 text-lg mb-0.5">{component.name}</h3>
                            <p className="text-xs text-slate-500">Owned by <span className="font-medium text-slate-600">{component.owner}</span></p>
                        </div>
                        {component.terraformStatus && (
                            <div className="flex items-center ml-4">
                                {getStatusIcon()}
                            </div>
                        )}
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2 line-clamp-1">{component.description}</p>
                    
                    {/* Show error message if Terraform run failed */}
                    {component.terraformStatus === 'errored' && component.terraformError && (
                        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-xs text-red-800 font-medium mb-0.5">Error:</p>
                            <p className="text-xs text-red-600 line-clamp-1">{component.terraformError}</p>
                        </div>
                    )}
                    
                    {/* Status badges */}
                    <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {component.type}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {component.lifecycle}
                        </span>
                        {getStatusBadge()}
                    </div>
                </div>

                {/* Right Side - Actions */}
                <div className="flex-shrink-0 p-4 flex flex-col items-end justify-center gap-2 bg-slate-50 border-l border-slate-200">
                    {canDelete && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClick();
                            }}
                            disabled={isDeleting || component.isDestroying}
                            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:hover:from-red-600 disabled:hover:to-red-700"
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
                    )}
                    <a 
                        href={component.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
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
        </div>
    );
};

export default AppCard;
