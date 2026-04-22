import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PremiumLoader from './PremiumLoader';

const injectStyles = () => {
  if (document.getElementById('nx-sp-styles')) return;
  const s = document.createElement('style');
  s.id = 'nx-sp-styles';
  s.textContent = `
    .nx-sp-root {
      font-family: 'Inter', -apple-system, sans-serif;
      min-height: 100vh;
      background: #f5f5f7;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .nx-sp-card {
      width: 100%; max-width: 440px;
      background: #fff;
      border-radius: 20px; padding: 48px 40px;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.10);
      text-align: center;
      animation: spIn 0.5s ease-out;
    }
    @keyframes spIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .nx-sp-icon {
      width: 56px; height: 56px; border-radius: 14px;
      background: var(--theme-secondary, #eef2ff); color: var(--theme-primary, #4f46e5);
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 24px;
    }
    .nx-sp-title { font-size: 24px; font-weight: 700; color: #111; letter-spacing: -0.5px; margin-bottom: 12px; }
    .nx-sp-desc { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 32px; }
    
    .nx-sp-field { text-align: left; margin-bottom: 20px; }
    .nx-sp-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px; }
    .nx-sp-input {
      width: 100%; height: 44px; padding: 0 14px;
      border: 1.5px solid #e5e7eb; border-radius: 9px;
      font-size: 14px; color: #111; outline: none; transition: all 0.2s;
    }
    .nx-sp-input:focus { border-color: var(--theme-primary, #4f46e5); box-shadow: 0 0 0 3px var(--theme-secondary, rgba(79,70,229,0.12)); }
    .nx-sp-input.err { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
    .nx-sp-error-text { color: #ef4444; font-size: 12.5px; font-weight: 500; margin-top: -6px; margin-bottom: 12px; text-align: left; }
    
    .nx-sp-btn {
      width: 100%; height: 46px; background: var(--theme-primary, #3730A3); color: white;
      border: none; border-radius: 9px; font-weight: 600; font-size: 14.5px;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
      margin-top: 12px;
    }
    .nx-sp-btn:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 4px 14px var(--theme-secondary, rgba(55,48,163,0.35)); transform: translateY(-1px); }
    .nx-sp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `;
  document.head.appendChild(s);
};

export default function SetPassword({ mode = 'google' }) {
  const { showAlert } = useAlert();
  const { refreshStatus } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token from URL if in invitation mode
  const token = mode === 'invitation' ? new URLSearchParams(window.location.search).get('token') : null;

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (touched) {
      if (password.length > 0 && password.length < 8) {
        setPasswordError('Password must be at least 8 characters.');
      } else if (password.length > 0 && !/[A-Z]/.test(password)) {
        setPasswordError('Password must contain at least one uppercase letter.');
      } else if (password.length > 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setPasswordError('Password must contain at least one special character.');
      } else {
        setPasswordError('');
      }
    }

    if (confirmTouched) {
      if (confirmPassword.length > 0 && password !== confirmPassword) {
        setConfirmError('Passwords do not match.');
      } else {
        setConfirmError('');
      }
    }
  }, [password, confirmPassword, touched, confirmTouched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setConfirmTouched(true);

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setPasswordError('Password must contain at least one special character.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'invitation') {
        if (!token) throw new Error('Activation token missing.');
        await api.post('/auth/accept-invitation', { token, password });
        showAlert('Account activated successfully! Please sign in.', 'success');
        setSuccess(true);
        setTimeout(() => { navigate('/auth/login'); }, 2000);
      } else {
        await api.post('/auth/set-password', { newPassword: password });
        showAlert('Password set successfully. Welcome!', 'success');
        await refreshStatus();
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Synchronization failure.';
      setPasswordError(msg);
      setLoading(false);
    }
  };

  if (loading && !success) return <PremiumLoader message="Processing secure request..." fullScreen />;

  return (
    <div className="nx-sp-root">
      <div className="nx-sp-card">
        <div className="nx-sp-icon">
          {success ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>
        
        {success ? (
          <>
            <h2 className="nx-sp-title">Success!</h2>
            <p className="nx-sp-desc">
              Your account has been activated. We are redirecting you to the login page now.
            </p>
          </>
        ) : (
          <>
            <h2 className="nx-sp-title">
              {mode === 'invitation' ? 'Activate Your Account' : 'Secure Your Account'}
            </h2>
            <p className="nx-sp-desc">
              {mode === 'invitation' 
                ? 'Welcome to NexusOS! Please set a secure password to activate your workspace and join your organization.'
                : 'You registered via Google OAuth. To ensure maximum enterprise security, please set a backup password for your profile.'
              }
            </p>

            <form onSubmit={handleSubmit}>
              <div className="nx-sp-field">
                <label className="nx-sp-label">New Password</label>
                <input
                  type="password"
                  className={`nx-sp-input ${passwordError ? 'err' : ''}`}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setTouched(true); }}
                />
                {passwordError && <div className="nx-sp-error-text" style={{ marginTop: '6px', marginBottom: 0 }}>{passwordError}</div>}
              </div>
              <div className="nx-sp-field">
                <label className="nx-sp-label">Confirm Password</label>
                <input
                  type="password"
                  className={`nx-sp-input ${confirmError ? 'err' : ''}`}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setConfirmTouched(true); }}
                />
                {confirmError && <div className="nx-sp-error-text" style={{ marginTop: '6px', marginBottom: 0 }}>{confirmError}</div>}
              </div>

              <button type="submit" className="nx-sp-btn" disabled={loading}>
                {mode === 'invitation' ? 'Activate Account' : 'Save Setup & Continue'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
