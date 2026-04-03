import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Login from './components/Login';
import Register from './components/Register';
import CompleteProfile from './components/CompleteProfile';
import AdminDashboard from './components/admin/Dashboard';
import OnboardingGoogle from './components/onboarding/OnboardingGoogle';
import PremiumLoader from './components/PremiumLoader';
import AcceptInvitation from './components/AcceptInvitation';
import { useAlert } from './context/AlertContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import PremiumAlert from './components/PremiumAlert';
import PremiumConfirmation from './components/PremiumConfirmation';

import { api } from './utils/api';

function App() {
  const { showAlert } = useAlert();
  // Stable ref so the URL-error effect doesn't re-run when showAlert identity changes
  const showAlertRef = useRef(showAlert);
  useEffect(() => { showAlertRef.current = showAlert; }, [showAlert]);

  const [token, setToken] = useState(localStorage.getItem('token'));
  // If user landed directly on /accept-invitation, lock into that view immediately
  const isAcceptInvite = window.location.pathname.startsWith('/accept-invitation');
  const [view, setView] = useState(isAcceptInvite ? 'accept-invitation' : 'login');
  const [isLoading, setIsLoading] = useState(false);

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
    // Don't process OAuth tokens/errors when on the invitation page
    if (isAcceptInvite) return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlError = urlParams.get('error');

    if (urlToken) {
      saveToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlError) {
      showAlertRef.current(
        urlError === 'email_exists'
          ? 'An account with this email already exists. Please log in with your password.'
          : 'Authentication failed.',
        'error'
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAcceptInvite) return;

    const checkStatus = async () => {
      if (token) {
        setIsLoading(true);
        try {
          // Verify with backend
          const response = await api.get('/onboarding/check-status');
          const { has_company, profile_complete } = response.data;
          
          if (!has_company) {
            setView('onboarding-google');
          } else if (!profile_complete) {
            setView('complete-profile');
          } else {
            setView('dashboard');
          }
        } catch (e) {
          console.error('Session validation failed', e);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const renderView = () => {
    if (isLoading) {
      return <PremiumLoader message="Initializing Secure Environment..." fullScreen />;
    }

    switch (view) {
      case 'accept-invitation':
        return <AcceptInvitation />;
      case 'login':
        return <Login setToken={saveToken} setView={setView} />;
      case 'register':
        return <Register setView={setView} />;
      case 'onboarding-google':
        return <OnboardingGoogle api={api} setToken={saveToken} />;
      case 'complete-profile':
        return <CompleteProfile api={api} setToken={saveToken} />;
      case 'dashboard':
        return <AdminDashboard api={api} token={token} logout={logout} />;
      default:
        return <Login setToken={saveToken} setView={setView} />;
    }
  };

  return (
    <ConfirmationProvider>
      <PremiumAlert />
      <div className="App">{renderView()}</div>
    </ConfirmationProvider>
  );
}

export default App;