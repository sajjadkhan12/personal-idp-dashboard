
import React from 'react';
import { SOCIAL_LOGINS } from '../constants';

const Login: React.FC = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/login/github';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Internal Developer Platform
        </h1>
        <p className="text-center text-slate-500 mb-8">A centralized platform for developers.</p>
        <div className="space-y-3">
          {SOCIAL_LOGINS.map((social) => (
            <button
              key={social.name}
              onClick={handleLogin}
              className={`w-full flex items-center justify-center py-2.5 px-4 border border-slate-300 rounded-md transition-colors duration-200 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${social.bgColor} ${social.textColor}`}
            >
              {social.icon}
              Sign in with {social.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;

