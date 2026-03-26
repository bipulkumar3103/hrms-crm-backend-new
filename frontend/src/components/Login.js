import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Add setView to the component's props to allow switching to the register view
function Login({ setToken, setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/v1/auth/login', { email, password });
      setToken(response.data.access_token);
    } catch (error) { 
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Invalid credentials. Please try again.');
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
      console.error('Login failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const host = window.location.host;
    let backendUrl;

    if (host.includes('cloudworkstations.dev') || host.includes('idx.dev')) {
      // If we are on port 3000, we need to target port 5000 for the backend
      const backendHost = host.replace('3000-', '5000-');
      backendUrl = `https://${backendHost}/api/v1/auth/login/google`;
    } else {
      // Local development
      backendUrl = 'http://localhost:5000/api/v1/auth/login/google';
    }

    console.log("DEBUG: Redirecting to Backend Google Auth:", backendUrl);
    window.location.href = backendUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto overflow-hidden">
        
        {/* Left Panel: Branding & Illustration */}
        <div className={`w-full md:w-1/2 p-8 sm:p-12 bg-gradient-to-tr from-indigo-600 to-purple-700 text-white flex flex-col justify-center items-center transition-all duration-1000 transform ${isMounted ? 'opacity-100 -translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className={`transform transition-transform duration-1000 delay-300 ${isMounted ? 'scale-100' : 'scale-125'}`}>
                <svg width="80%" viewBox="0 0 151 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6 opacity-50">
                    <rect x="3" y="3" width="145" height="95" rx="8" stroke="white" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.5"/>
                    <circle cx="53" cy="50" r="20" stroke="white" strokeWidth="2"/>
                    <path d="M71 50C71 61.0457 79.9543 70 91 70C102.046 70 111 61.0457 111 50C111 38.9543 102.046 30 91 30C79.9543 30 71 38.9543 71 50Z" stroke="white" strokeOpacity="0.7" strokeWidth="2"/>
                    <line x1="23" y1="50" x2="33" y2="50" stroke="white" strokeWidth="2"/>
                    <line x1="111" y1="50" x2="121" y2="50" stroke="white" strokeWidth="2" strokeOpacity="0.7"/>
                </svg>
            </div>
            <h1 className={`text-4xl font-bold mb-3 transition-opacity duration-700 delay-200 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>Unlock Your Potential</h1>
            <p className={`text-lg text-center opacity-90 transition-opacity duration-700 delay-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>Built for the future of enterprise management.</p>
        </div>

        {/* Right Panel: Form */}
        <div className={`w-full md:w-1/2 p-8 md:p-12 transition-all duration-1000 transform ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Login</h2>
          <p className="text-gray-500 mb-8">Enter your credentials to continue.</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

            <div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all duration-300 ease-in-out transform hover:scale-105">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.437,36.218,48,30.455,48,24C48,22.659,47.862,21.35,47.611,20.083z"/></svg>
              Sign in with Google
            </button>
          </div>

          {/* --- Added Register Link --- */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account? 
            <button onClick={() => setView('register')} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none">
               Register Now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;