import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import { User } from '../types';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout');
      router.push('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
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

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar 
        user={user} 
        activeView="catalog"
        setView={handleSetView} 
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col">
        <MainContent user={user} />
      </main>
    </div>
  );
};

export default DashboardPage;

