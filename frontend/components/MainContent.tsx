import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import Header from './Header';
import AppGrid from './AppGrid';
import { User, SoftwareComponent } from '../types';

interface MainContentProps {
    user: User;
}

const MainContent: React.FC<MainContentProps> = ({ user }) => {
    const [components, setComponents] = useState<SoftwareComponent[]>([]);
    const [filteredComponents, setFilteredComponents] = useState<SoftwareComponent[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('All');

    const fetchComponents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/components');
            if (!response.ok) {
                throw new Error('Failed to fetch components');
            }
            const data = await response.json();
            setComponents(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching components:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setComponents([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComponents();
    }, [fetchComponents]);

    const types = useMemo(() => {
        if (!components) return ['All'];
        return ['All', ...Array.from(new Set(components.map(c => c.type)))];
    }, [components]);

    useEffect(() => {
        const lowercasedQuery = activeSearch.toLowerCase().trim();
        let result = components;

        // 1. Filter by type
        if (activeFilter !== 'All') {
            result = result.filter(c => c.type === activeFilter);
        }

        // 2. Filter by search query
        if (lowercasedQuery) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowercasedQuery) ||
                c.description.toLowerCase().includes(lowercasedQuery) ||
                c.owner.toLowerCase().includes(lowercasedQuery)
            );
        }
        
        setFilteredComponents(result);
    }, [components, activeSearch, activeFilter]);

    const handleSearch = () => {
        setActiveSearch(searchQuery);
    };

    // Reset search when the input is cleared
    useEffect(() => {
        if (searchQuery.trim() === '' && activeSearch !== '') {
            setActiveSearch('');
        }
    }, [searchQuery, activeSearch]);

    // Poll for Terraform run status updates
    useEffect(() => {
        const componentsWithRuns = components.filter(c => {
            // Only poll components that have a run ID, a status, and are not in final states
            const hasRun = c.terraformRunId && c.terraformStatus;
            const isActive = c.terraformStatus && !['applied', 'errored', 'canceled', 'discarded'].includes(c.terraformStatus);
            return hasRun && isActive;
        });
        
        if (componentsWithRuns.length === 0) return;

        const pollInterval = setInterval(async () => {
            try {
                const updates = await Promise.all(
                    componentsWithRuns.map(async (component) => {
                        if (!component.terraformRunId) return null;
                        
                        try {
                            const response = await fetch(`/api/runs/${component.terraformRunId}/status`);
                            if (response.ok) {
                                const status = await response.json();
                                return { id: component.id, status: status.status, error: status.error };
                            }
                        } catch (error) {
                            console.error(`Error polling status for ${component.id}:`, error);
                        }
                        return null;
                    })
                );

                const validUpdates = updates.filter(u => u !== null) as Array<{ id: string; status: string; error?: string }>;
                
                if (validUpdates.length > 0) {
                    setComponents(prev => {
                        // Create a set of component IDs that we're updating for safety
                        const updatingIds = new Set(validUpdates.map(u => u.id));
                        
                        const updated = prev.map(c => {
                            // Only update components that are in our componentsWithRuns list
                            if (!updatingIds.has(c.id)) {
                                return c;
                            }
                            
                            const update = validUpdates.find(u => u.id === c.id);
                            if (!update) return c;
                            
                            // If destroy completed successfully, remove from catalog
                            // Only remove if explicitly marked as destroying AND status is applied
                            if (update.status === 'applied' && c.isDestroying === true) {
                                // Immediately remove from local state
                                return null; // Mark for removal
                            }
                            
                            // Notification for status changes to applied
                            if (update.status === 'applied' && c.terraformStatus !== 'applied') {
                                if (c.isDestroying) {
                                    toast.success(`${c.name} has been destroyed`);
                                } else {
                                    toast.success(`${c.name} is now active!`);
                                }
                            }
                            
                            // Notification for status changes to errored
                            if (update.status === 'errored' && c.terraformStatus !== 'errored') {
                                if (c.isDestroying) {
                                    toast.error(`${c.name} failed to destroy`);
                                } else {
                                    toast.error(`${c.name} failed to provision`);
                                }
                            }
                            
                            return { ...c, terraformStatus: update.status, terraformError: update.error };
                        });
                        
                        // Remove null items (destroyed components)
                        const filtered = updated.filter(c => c !== null) as SoftwareComponent[];
                        return filtered;
                    });
                }
            } catch (error) {
                console.error('Error polling run statuses:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [components]);

    return (
        <>
            <Header
                user={user}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
            />
            <div className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">My Services</h1>
                <p className="text-slate-500 mb-8">All your services and applications in one place.</p>
                
                <div className="mb-8 flex items-center space-x-2 flex-wrap">
                    {types.map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveFilter(type)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 mb-2 ${
                                activeFilter === type
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                            }`}
                        >
                            {/* Capitalize first letter */}
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {isLoading && <p>Loading components...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}
                {!isLoading && !error && (
                    <AppGrid components={filteredComponents} onComponentDeleted={fetchComponents} user={user}/>
                )}
            </div>
        </>
    );
};

export default MainContent;