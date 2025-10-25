import React from 'react';

interface CreateServiceModalProps {
    status: 'loading' | 'success' | 'error';
    onDone: () => void;
    error: string | null;
    runStatus?: string | null;
}

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({ status, onDone, error, runStatus }) => {
    const getStatusMessage = () => {
        if (!runStatus) return 'Please wait while we set up your new software component...';
        
        const statusMessages: Record<string, string> = {
            'pending': 'Run is queued and waiting to start...',
            'plan_queued': 'Planning phase is queued...',
            'planning': 'Planning your infrastructure...',
            'planned': 'Plan completed successfully!',
            'apply_queued': 'Apply phase is queued...',
            'applying': 'Applying your infrastructure...',
            'applied': 'Infrastructure applied successfully!',
            'errored': 'Terraform run encountered an error.',
            'canceled': 'Terraform run was canceled.',
            'discarded': 'Terraform run was discarded.',
        };
        
        return statusMessages[runStatus] || `Status: ${runStatus}`;
    };

    const getStatusColor = () => {
        if (!runStatus) return 'blue';
        if (runStatus === 'applied') return 'green';
        if (runStatus === 'errored' || runStatus === 'canceled') return 'red';
        return 'blue';
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <h2 className="text-xl font-bold text-slate-800 mt-6">Creating Component</h2>
                        <p className="mt-2 text-slate-600">{getStatusMessage()}</p>
                        {runStatus && (
                            <div className="mt-4 px-4 py-2 bg-blue-50 rounded-md">
                                <p className="text-sm text-blue-800 font-medium">Terraform Status: {runStatus}</p>
                            </div>
                        )}
                    </>
                );
            case 'success':
                return (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                           <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mt-6">Component Created!</h2>
                        <p className="mt-2 text-slate-600">Your new component is ready. You will be redirected to the catalog.</p>
                        <div className="mt-8">
                            <button onClick={onDone} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                                Go to Catalog
                            </button>
                        </div>
                    </>
                );
            case 'error':
                 return (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                            <svg className="h-10 w-10 text-red-600" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mt-6">Creation Failed</h2>
                        <p className="mt-2 text-slate-600 bg-red-50 p-3 rounded-md">
                            <strong>Error:</strong> {error || 'An unexpected error occurred.'}
                        </p>
                         <div className="mt-8">
                            <button onClick={onDone} className="w-full bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded hover:bg-slate-300 transition-colors">
                                Close
                            </button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
                {renderContent()}
            </div>
        </div>
    );
};

export default CreateServiceModal;
