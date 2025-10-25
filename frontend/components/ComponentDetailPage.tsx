import React from 'react';
import { useRouter } from 'next/router';
import { SoftwareComponent } from '../types';

interface ComponentDetailPageProps {
    component: SoftwareComponent;
    onBack: () => void;
}

const ComponentDetailPage: React.FC<ComponentDetailPageProps> = ({ component, onBack }) => {
    const router = useRouter();

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
            <span className={`inline-flex items-center px-3 py-1 ${config.bg} ${config.color} rounded-full font-semibold uppercase tracking-wide text-sm`}>
                {config.text}
            </span>
        );
    };

    const isGCPBucket = component.type === 'Infrastructure' && component.githubUrl.includes('console.cloud.google.com');

    return (
        <div className="flex-1 flex flex-col bg-slate-100">
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <button
                    onClick={onBack}
                    className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Catalog
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">{component.name}</h1>
                        <p className="text-slate-600">{component.description}</p>
                    </div>
                    {getStatusBadge()}
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Type</p>
                                <p className="text-sm font-medium text-slate-800">{component.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Lifecycle</p>
                                <p className="text-sm font-medium text-slate-800">{component.lifecycle}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Owner</p>
                                <p className="text-sm font-medium text-slate-800">{component.owner}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Created</p>
                                <p className="text-sm font-medium text-slate-800">
                                    {new Date(component.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {component.terraformStatus === 'errored' && component.terraformError && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-red-500">
                            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Details</h2>
                            <p className="text-sm text-red-600 whitespace-pre-wrap">{component.terraformError}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">Actions</h2>
                        <div className="flex gap-4">
                            <a
                                href={component.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
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
            </div>
        </div>
    );
};

export default ComponentDetailPage;

