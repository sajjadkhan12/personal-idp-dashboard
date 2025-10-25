import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import CreateDetailPage from '../../components/CreateDetailPage';
import { User, SoftwareTemplate } from '../../types';
import { SOFTWARE_TEMPLATES } from '../../constants';

const CreateTemplatePage: React.FC = () => {
  const router = useRouter();
  const { template } = router.query;
  
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<SoftwareTemplate | null>(null);

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

  useEffect(() => {
    if (template && typeof template === 'string') {
      const foundTemplate = SOFTWARE_TEMPLATES.find(t => t.id === template);
      setSelectedTemplate(foundTemplate || null);
    }
  }, [template]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout');
      router.push('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleBackToCreate = () => {
    router.push('/create');
  };

  const handleCreationSuccess = () => {
    router.push('/dashboard');
  };

  const handleSetView = (view: 'catalog' | 'create') => {
    if (view === 'catalog') {
      router.push('/dashboard');
    } else {
      router.push('/create');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (!selectedTemplate) {
    return (
      <div className="flex h-screen bg-slate-100">
        <Sidebar 
          user={user} 
          activeView="create"
          setView={handleSetView} 
          onLogout={handleLogout}
        />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-600">Template not found</p>
          <button 
            onClick={handleBackToCreate}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Create
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar 
        user={user} 
        activeView="create"
        setView={handleSetView} 
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col">
        <CreateDetailPage 
          template={selectedTemplate} 
          onBack={handleBackToCreate}
          onCreationSuccess={handleCreationSuccess}
        />
      </main>
    </div>
  );
};

export default CreateTemplatePage;

