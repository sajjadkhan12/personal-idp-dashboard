
import React from 'react';

const Login: React.FC = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/login/github';
  };

  const handleDummyLogin = (provider: string) => {
    // Dummy login for now
    console.log(`Login with ${provider} - Coming soon!`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Subtle curved lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: '#fff', stopOpacity: 0.3}} />
            <stop offset="50%" style={{stopColor: '#fff', stopOpacity: 0.1}} />
            <stop offset="100%" style={{stopColor: '#fff', stopOpacity: 0.3}} />
          </linearGradient>
        </defs>
        <path d="M0,200 Q250,150 500,200 T1000,200" fill="none" stroke="url(#lineGradient)" strokeWidth="1"/>
        <path d="M0,400 Q250,350 500,400 T1000,400" fill="none" stroke="url(#lineGradient)" strokeWidth="1"/>
      </svg>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">IDP</span>
          </div>
          <span className="text-xl font-bold text-slate-800">Personal IDP</span>
        </div>
      </div>

      {/* Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Sign in icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            Sign in with GitHub
          </h1>
          
          {/* Description */}
          <p className="text-center text-slate-600 mb-8 text-sm leading-relaxed">
            Manage your infrastructure, deploy services, and collaborate with your team. For free.
          </p>

          {/* GitHub Login Button */}
          <button
            onClick={handleLogin}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-6 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Get Started
          </button>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-slate-500">Or sign in with</span>
            </div>
          </div>

          {/* Social Login Icons */}
          <div className="flex justify-center space-x-4">
            {/* Google */}
            <button
              onClick={() => handleDummyLogin('Google')}
              className="w-14 h-14 bg-white rounded-full shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleDummyLogin('Facebook')}
              className="w-14 h-14 bg-white rounded-full shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            {/* Apple */}
            <button
              onClick={() => handleDummyLogin('Apple')}
              className="w-14 h-14 bg-slate-800 rounded-full shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

