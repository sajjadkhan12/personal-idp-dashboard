import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import ComponentDetailPage from '../../components/ComponentDetailPage';
import { User, SoftwareComponent } from '../../types';

const ComponentDetailRoute: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<SoftwareComponent | null>(null);
  const [componentLoading, setComponentLoading] = useState(false);

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
    const fetchComponent = async () => {
      if (id && typeof id === 'string') {
        setComponentLoading(true);
        try {
          const response = await axios.get(`http://localhost:4000/api/components`);
          const components = response.data;
          const component = components.find((c: SoftwareComponent) => c.id === id);
          setSelectedComponent(component || null);
        } catch (error) {
          console.error('Error fetching component:', error);
          setSelectedComponent(null);
        } finally {
          setComponentLoading(false);
        }
      }
    };
    fetchComponent();
    
    // Poll for status updates if component has a Terraform run
    if (id && typeof id === 'string') {
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:4000/api/components`);
          const components = response.data;
          const component = components.find((c: SoftwareComponent) => c.id === id);
          if (component) {
            setSelectedComponent(component);
            
            // Stop polling if in final state
            if (component.terraformStatus && ['applied', 'errored', 'canceled', 'discarded'].includes(component.terraformStatus)) {
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error('Error polling component status:', error);
        }
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [id]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout');
      router.push('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleBackToCatalog = () => {
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

  if (componentLoading) {
    return (
      <div className="flex h-screen bg-slate-100">
        <Sidebar 
          user={user} 
          activeView="catalog"
          setView={handleSetView} 
          onLogout={handleLogout}
        />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!selectedComponent) {
    return (
      <div className="flex h-screen bg-slate-100">
        <Sidebar 
          user={user} 
          activeView="catalog"
          setView={handleSetView} 
          onLogout={handleLogout}
        />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">Component not found</p>
          <button 
            onClick={handleBackToCatalog}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Catalog
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar 
        user={user} 
        activeView="catalog"
        setView={handleSetView} 
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col">
        <ComponentDetailPage 
          component={selectedComponent} 
          onBack={handleBackToCatalog}
        />
      </main>
    </div>
  );
};

export default ComponentDetailRoute;

