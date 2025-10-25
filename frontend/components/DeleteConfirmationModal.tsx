// Fix: Implement the DeleteConfirmationModal component.
import React, { useState } from 'react';
import { SoftwareComponent } from '../types';

interface DeleteConfirmationModalProps {
    component: SoftwareComponent;
    onConfirm: () => void;
    onCancel: () => void;
    onDestroyComplete: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ component, onConfirm, onCancel, onDestroyComplete }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/components/${component.id}/destroy`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to destroy component');
            }
            
            onConfirm(); // Signal parent that destroy was initiated
            setIsLoading(false);
            // Close modal immediately after destroy is initiated
            onDestroyComplete();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsLoading(false); // On error, stop loading
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-xl font-bold text-slate-800">Confirm Destruction</h2>
                <p className="mt-4 text-slate-600">
                    Are you sure you want to destroy <span className="font-bold">{component.name}</span>? This will trigger Terraform to destroy the infrastructure. This action cannot be undone.
                </p>
                
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                
                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onCancel} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded hover:bg-slate-300 transition-colors" disabled={isLoading}>
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 transition-colors flex items-center" disabled={isLoading}>
                         {isLoading ? 'Destroying...' : 'Destroy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;