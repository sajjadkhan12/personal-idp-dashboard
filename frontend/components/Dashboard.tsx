import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import CreateNew from './CreateNew';
import CreateDetailPage from './CreateDetailPage';
import Overview from './Overview';
import { User, SoftwareTemplate } from '../types';

interface DashboardProps {
    user: User;
    onLogout: () => void;
    validateSession: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, validateSession }) => {
    const router = useRouter();
    const [activeView, setActiveView] = useState<'dashboard' | 'my-services' | 'marketplace' | 'create-detail'>('dashboard');
    const [selectedTemplate, setSelectedTemplate] = useState<SoftwareTemplate | null>(null);

    // Sync activeView with URL query parameter
    useEffect(() => {
        const tab = router.query.tab as string;
        if (tab) {
            // Map URL params to internal state
            if (tab === 'my-services') {
                setActiveView('my-services');
            } else if (tab === 'marketplace') {
                setActiveView('marketplace');
            } else if (tab === 'dashboard') {
                setActiveView('dashboard');
            } else {
                // Unknown tab, default to dashboard
                setActiveView('dashboard');
            }
        } else {
            // Default to dashboard when no tab specified
            setActiveView('dashboard');
        }
    }, [router]);

    const handleTemplateSelect = (template: SoftwareTemplate) => {
        setSelectedTemplate(template);
        setActiveView('create-detail');
    };
    
    const handleBackToMarketplace = () => {
        setSelectedTemplate(null);
        setActiveView('marketplace');
    };

    const handleCreationSuccess = () => {
        setSelectedTemplate(null);
        setActiveView('my-services');
    };

    const handleSetView = async (view: 'dashboard' | 'my-services' | 'marketplace') => {
        await validateSession();
        setSelectedTemplate(null);
        
        // Map internal view to URL param
        const urlTab = view === 'my-services' ? 'my-services' : 
                      view === 'marketplace' ? 'marketplace' : 
                      'dashboard';
        setActiveView(view);
        router.push(`/dashboard?tab=${urlTab}`, undefined, { shallow: true });
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Overview user={user} />;
            case 'my-services':
                return <MainContent user={user} />;
            case 'marketplace':
                return <CreateNew onTemplateSelect={handleTemplateSelect} />;
            case 'create-detail':
                if (selectedTemplate) {
                    return <CreateDetailPage 
                                template={selectedTemplate} 
                                onBack={handleBackToMarketplace}
                                onCreationSuccess={handleCreationSuccess}
                            />;
                }
                // Fallback if no template is selected
                setActiveView('marketplace');
                return null;
            default:
                return <Overview user={user} />;
        }
    }

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar 
                user={user} 
                // Map 'create-detail' to 'marketplace' for the Sidebar's activeView prop
                activeView={activeView === 'create-detail' ? 'marketplace' : (activeView as 'dashboard' | 'my-services' | 'marketplace')} 
                setView={handleSetView} 
                onLogout={onLogout}
            />
            <main className="flex-1 flex flex-col">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default Dashboard;