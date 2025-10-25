import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User } from './types';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const validateSession = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/me');
      setUser(response.data);
    } catch (error) {
      // If the request fails, it means the user is not authenticated
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initialValidation = async () => {
      await validateSession();
      setLoading(false);
    }
    initialValidation();
  }, [validateSession]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout');
      setUser(null);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {user ? <Dashboard user={user} onLogout={handleLogout} validateSession={validateSession} /> : <Login />}
    </div>
  );
};

export default App;
