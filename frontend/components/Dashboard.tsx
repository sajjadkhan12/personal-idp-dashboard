import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import CreateNew from './CreateNew';
import CreateDetailPage from './CreateDetailPage';
import { User, SoftwareTemplate } from '../types';

interface DashboardProps {
    user: User;
    onLogout: () => void;
    validateSession: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, validateSession }) => {
    const [activeView, setActiveView] = useState<'catalog' | 'create' | 'create-detail'>('catalog');
    const [selectedTemplate, setSelectedTemplate] = useState<SoftwareTemplate | null>(null);

    const handleTemplateSelect = (template: SoftwareTemplate) => {
        setSelectedTemplate(template);
        setActiveView('create-detail');
    };
    
    const handleBackToCreate = () => {
        setSelectedTemplate(null);
        setActiveView('create');
    };

    const handleCreationSuccess = () => {
        setSelectedTemplate(null);
        setActiveView('catalog');
    };

    const handleSetView = async (view: 'catalog' | 'create') => {
        await validateSession();
        setSelectedTemplate(null);
        setActiveView(view);
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'catalog':
                return <MainContent user={user} />;
            case 'create':
                return <CreateNew onTemplateSelect={handleTemplateSelect} />;
            case 'create-detail':
                if (selectedTemplate) {
                    return <CreateDetailPage 
                                template={selectedTemplate} 
                                onBack={handleBackToCreate}
                                onCreationSuccess={handleCreationSuccess}
                            />;
                }
                // Fallback if no template is selected
                setActiveView('create');
                return null;
            default:
                return <MainContent user={user} />;
        }
    }

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar 
                user={user} 
                // FIX: Map 'create-detail' to 'create' for the Sidebar's activeView prop. This ensures the prop type matches and the correct nav item is highlighted.
                activeView={activeView === 'create-detail' ? 'create' : activeView} 
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