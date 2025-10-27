import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import Overview from '../components/Overview';
import CreateNew from '../components/CreateNew';
import { User } from '../types';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-services' | 'marketplace'>('dashboard');

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/me');
        setUser(response.data);
      } catch (error) {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [router]);

  // Sync with URL query parameter
  useEffect(() => {
    const tab = router.query.tab as string;
    if (tab === 'my-services') {
      setActiveTab('my-services');
    } else if (tab === 'marketplace') {
      setActiveTab('marketplace');
    } else if (tab === 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [router.query.tab]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout');
      router.push('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleSetView = (view: 'dashboard' | 'my-services' | 'marketplace') => {
    if (view === 'my-services') {
      router.push('/dashboard?tab=my-services');
    } else if (view === 'dashboard') {
      router.push('/dashboard?tab=dashboard');
    } else if (view === 'marketplace') {
      router.push('/dashboard?tab=marketplace');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Overview user={user} />;
      case 'my-services':
        return <MainContent user={user} />;
      case 'marketplace':
        return <CreateNew onTemplateSelect={() => {}} />;
      default:
        return <Overview user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar 
        user={user} 
        activeView={activeTab}
        setView={handleSetView} 
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
};

export default DashboardPage;

