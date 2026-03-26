import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Login from './components/Login';
import Register from './components/Register';
import CompleteProfile from './components/CompleteProfile';
import AdminDashboard from './components/admin/Dashboard';
import OnboardingGoogle from './components/onboarding/OnboardingGoogle';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

  const api = useMemo(() => {
    return axios.create({
      baseURL: '/api/v1',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }, [token]);

  const saveToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('login');
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlError = urlParams.get('error');

    console.log("DEBUG: Checking URL for token/error", { urlToken, urlError });

    if (urlToken) {
      console.log('Token received from URL:', urlToken);
      saveToken(urlToken);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlError) {
      console.error('Auth error from URL:', urlError);
      alert(urlError === 'email_exists' ? 'An account with this email already exists. Please log in with your password.' : 'Authentication failed.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      if (token) {
        setIsLoading(true);
        console.log("DEBUG: Current Token found, calling check-status API");
        try {
          const decoded = jwtDecode(token);
          console.log('Decoded Token:', decoded);

          // Call the onboarding check-status endpoint to determine current state
          const response = await api.get('/onboarding/check-status');
          console.log("DEBUG: Onboarding Status Response:", response.data);
          const { has_company, profile_complete } = response.data;

          if (!has_company) {
            setView('onboarding-google');
          } else if (!profile_complete) {
            setView('complete-profile');
          } else {
            setView('dashboard');
          }
        } catch (e) {
          console.error("DEBUG: checkStatus Error details:", e.response?.data || e.message);
          console.error('Session validation or status check failed', e);
          logout();
        } finally {
          setIsLoading(false);
        }
      } else {
        setView('login');
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [token, api]);

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    switch (view) {
      case 'login':
        return <Login setToken={saveToken} setView={setView} />;
      case 'register':
        return <Register setView={setView} />;
      case 'onboarding-google':
        return <OnboardingGoogle api={api} setToken={saveToken} />;
      case 'complete-profile':
        return <CompleteProfile api={api} setToken={saveToken} />;
      case 'dashboard':
        return <AdminDashboard api={api} logout={logout} />;
      default:
        return <Login setToken={saveToken} setView={setView} />;
    }
  };

  return <div className="App">{renderView()}</div>;
}

export default App;