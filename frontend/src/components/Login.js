
import React, { useState, useEffect, useRef } from 'react';
import { api, API_PATH } from '../utils/api';
import PremiumLoader from './PremiumLoader';

/* ─── Font injection ─── */
const injectFonts = () => {
  if (document.getElementById('nx-fonts')) return;
  const l = document.createElement('link');
  l.id = 'nx-fonts';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(l);
};

/* ─── Global styles ─── */
const injectStyles = () => {
  if (document.getElementById('nx-styles')) return;
  const s = document.createElement('style');
  s.id = 'nx-styles';
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .nx-root {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      background: #f5f5f7;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Card shell ── */
    .nx-card {
      display: flex;
      width: 100%;
      max-width: 1040px;
      min-height: 620px;
      border-radius: 20px;
      overflow: hidden;
      background: #fff;
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.06),
        0 4px 6px rgba(0,0,0,0.03),
        0 24px 64px rgba(0,0,0,0.10);
      animation: cardIn .55s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ═══════════════════════════
       LEFT PANEL
    ═══════════════════════════ */
    .nx-left {
      width: 45%;
      background: #fff;
      display: flex;
      flex-direction: column;
      padding: 40px 48px;
      border-right: 1px solid #f0f0f0;
    }

    /* Top bar */
    .nx-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .nx-logo-wrap {
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .nx-logo-icon {
      width: 32px; height: 32px;
      background: #111;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .nx-logo-name {
      font-size: 15px;
      font-weight: 600;
      color: #111;
      letter-spacing: -0.3px;
    }
    .nx-back-btn {
      display: flex; align-items: center; gap: 6px;
      font-size: 13.5px; font-weight: 500; color: #6b7280;
      background: none; border: none; cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: color .15s;
      padding: 0;
    }
    .nx-back-btn:hover { color: #111; }

    /* Form area — centered vertically in remaining space */
    .nx-form-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      max-width: 340px;
      margin: 0 auto;
      padding: 32px 0;
    }

    .nx-heading {
      font-size: 28px;
      font-weight: 700;
      color: #0f0f0f;
      letter-spacing: -0.7px;
      line-height: 1.15;
      margin-bottom: 8px;
    }
    .nx-subheading {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 28px;
      font-weight: 400;
    }

    /* Inputs */
    .nx-field { margin-bottom: 14px; }
    .nx-field-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .nx-label {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }
    .nx-forgot-link {
      font-size: 13px;
      font-weight: 500;
      color: #4f46e5;
      background: none; border: none;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      padding: 0;
      transition: color .15s;
    }
    .nx-forgot-link:hover { color: #3730a3; }

    .nx-input {
      width: 100%;
      height: 42px;
      padding: 0 13px;
      border: 1.5px solid #e5e7eb;
      border-radius: 9px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      color: #111;
      background: #fff;
      outline: none;
      transition: border-color .18s, box-shadow .18s;
    }
    .nx-input::placeholder { color: #9ca3af; }
    .nx-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
    }
    .nx-input.err { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

    /* Toggle */
    .nx-toggle-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
    }
    .nx-toggle {
      position: relative;
      width: 40px; height: 22px; flex-shrink: 0;
      cursor: pointer;
    }
    .nx-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .nx-slider {
      position: absolute; inset: 0;
      background: #e5e7eb;
      border-radius: 100px;
      transition: background .2s;
    }
    .nx-slider::after {
      content: '';
      position: absolute;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #fff;
      top: 3px; left: 3px;
      transition: transform .2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .nx-toggle input:checked + .nx-slider { background: #4f46e5; }
    .nx-toggle input:checked + .nx-slider::after { transform: translateX(18px); }
    .nx-toggle-label { font-size: 13.5px; color: #374151; font-weight: 400; cursor: pointer; user-select: none; }

    /* Primary button */
    .nx-btn-primary {
      width: 100%;
      height: 44px;
      background: #3730A3;
      border: none; border-radius: 9px;
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      transition: background .18s, box-shadow .18s, transform .12s, opacity .18s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      letter-spacing: -0.1px;
      margin-bottom: 16px;
    }
    .nx-btn-primary:hover:not(:disabled) {
      background: #312E81;
      box-shadow: 0 4px 14px rgba(55, 48, 163, 0.35);
      transform: translateY(-1px);
    }
    .nx-btn-primary:active:not(:disabled) { transform: translateY(0); }
    .nx-btn-primary:disabled { opacity: .55; cursor: not-allowed; }

    /* Divider */
    .nx-divider {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 16px;
    }
    .nx-divider::before, .nx-divider::after {
      content: ''; flex: 1; height: 1px; background: #e5e7eb;
    }
    .nx-divider span { font-size: 12.5px; color: #9ca3af; white-space: nowrap; }

    /* Secondary button */
    .nx-btn-secondary {
      width: 100%;
      height: 44px;
      background: #fff;
      border: 1.5px solid #e5e7eb;
      border-radius: 9px;
      color: #374151;
      font-family: 'Inter', sans-serif;
      font-size: 14px; font-weight: 500;
      cursor: pointer;
      transition: background .18s, border-color .18s, transform .12s;
      display: flex; align-items: center; justify-content: center; gap: 9px;
      margin-bottom: 10px;
    }
    .nx-btn-secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      transform: translateY(-1px);
    }

    /* Alert */
    .nx-alert {
      display: flex; align-items: flex-start; gap: 8px;
      border-radius: 8px; padding: 10px 12px;
      font-size: 13px; line-height: 1.5;
      margin-bottom: 16px;
    }
    .nx-alert.err { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .nx-alert.ok  { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
    .nx-alert svg { flex-shrink: 0; margin-top: 1px; }

    /* Footer */
    .nx-left-footer {
      text-align: center;
      font-size: 13.5px;
      color: #6b7280;
      flex-shrink: 0;
    }
    .nx-left-footer button {
      color: #4f46e5;
      font-weight: 600;
      background: none; border: none;
      cursor: pointer; padding: 0;
      font-family: 'Inter', sans-serif;
      font-size: 13.5px;
      text-decoration: underline;
      text-underline-offset: 2px;
      transition: color .15s;
      margin-left: 4px;
    }
    .nx-left-footer button:hover { color: #3730a3; }

    /* Spinner */
    .nx-spin {
      width: 15px; height: 15px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      animation: spin .65s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ═══════════════════════════
       RIGHT PANEL
    ═══════════════════════════ */
    .nx-right {
      flex: 1; background: #1e1b4b; position: relative; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden;
    }
    .nx-right-bg { 
      position: absolute; inset: 0; 
      background: linear-gradient(145deg, #020617 0%, #1e1b4b 40%, #312E81 80%, #3730A3 100%);
      opacity: 0.95;
    }

    /* Subtle geometric shapes — NO blur */
    .nx-geo {
      position: absolute;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }
    .nx-geo1 { width: 200px; height: 200px; top: 28px; right: 40px; transform: rotate(18deg); }
    .nx-geo2 { width: 120px; height: 120px; top: 60px; right: 110px; transform: rotate(8deg); opacity: .6; }
    .nx-geo3 { width: 160px; height: 160px; bottom: 180px; left: 20px; transform: rotate(-12deg); opacity: .5; }
    .nx-geo4 { width: 80px; height: 80px; bottom: 220px; left: 80px; transform: rotate(5deg); opacity: .4; }

    /* Image Slideshow */
    .nx-slideshow {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 280px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.06),
        0 20px 60px rgba(0,0,0,0.3);
      animation: floatIn .6s .25s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes floatIn {
      from { opacity: 0; transform: translate(-50%, -43%); }
      to   { opacity: 1; transform: translate(-50%, -50%); }
    }
    .nx-slide-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out;
      transform: scale(1.05);
    }
    .nx-slide-img.active {
      opacity: 1;
      transform: scale(1);
    }

    /* Bottom banner */
    .nx-right-footer {
      position: relative; z-index: 2;
      padding: 32px 36px;
    }
    .nx-new-tag {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 10px; font-weight: 700;
      letter-spacing: 1.1px; text-transform: uppercase;
      color: rgba(255,255,255,0.85);
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 100px; padding: 4px 11px;
      margin-bottom: 12px;
    }
    .nx-right-title {
      font-size: 22px; font-weight: 700; color: #fff;
      letter-spacing: -0.5px; line-height: 1.3;
      margin-bottom: 8px;
    }
    .nx-right-sub {
      font-size: 13px; color: rgba(255,255,255,0.6);
      line-height: 1.65; max-width: 320px;
    }
    .nx-carousel-nav {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      margin-top: 22px;
    }
    .nx-c-btn {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.18);
      color: #fff; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .18s;
    }
    .nx-c-btn:hover { background: rgba(255,255,255,0.2); }
    .nx-dots-wrap { display: flex; align-items: center; gap: 6px; }
    .nx-dot {
      height: 3px; border-radius: 100px;
      background: rgba(255,255,255,0.3);
      cursor: pointer; transition: all .2s;
    }
    .nx-dot.on { background: #fff; }

    /* ── MODAL ── */
    .nx-modal-bg {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      opacity: 0; pointer-events: none;
      transition: opacity .22s;
    }
    .nx-modal-bg.open { opacity: 1; pointer-events: all; }
    .nx-modal {
      background: #fff;
      border-radius: 18px;
      padding: 36px 36px 30px;
      width: min(420px, 100%);
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.06),
        0 24px 80px rgba(0,0,0,0.18);
      transform: translateY(14px) scale(.97);
      opacity: 0;
      transition: transform .28s cubic-bezier(.22,1,.36,1), opacity .28s;
    }
    .nx-modal-bg.open .nx-modal { transform: translateY(0) scale(1); opacity: 1; }
    .nx-modal-icon-box {
      width: 46px; height: 46px; border-radius: 12px;
      background: #eef2ff;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    }
    .nx-modal h3 {
      font-size: 18px; font-weight: 700; color: #111;
      letter-spacing: -0.4px; margin-bottom: 6px;
    }
    .nx-modal p {
      font-size: 13.5px; color: #6b7280; line-height: 1.65; margin-bottom: 22px;
    }
    .nx-modal .nx-label { display: block; margin-bottom: 6px; }
    .nx-modal-footer {
      display: flex; gap: 10px; margin-top: 18px;
    }
    .nx-m-cancel {
      flex: 1; height: 42px;
      background: #fff; border: 1.5px solid #e5e7eb;
      border-radius: 9px; color: #374151;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: background .15s, border-color .15s;
    }
    .nx-m-cancel:hover { background: #f9fafb; border-color: #d1d5db; }
    .nx-m-send {
      flex: 1; height: 42px;
      background: #4f46e5; border: none;
      border-radius: 9px; color: #fff;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
      cursor: pointer;
      transition: background .15s, box-shadow .15s, opacity .15s;
      display: flex; align-items: center; justify-content: center; gap: 7px;
    }
    .nx-m-send:hover:not(:disabled) { background: #4338ca; box-shadow: 0 4px 14px rgba(79,70,229,0.28); }
    .nx-m-send:disabled { opacity: .5; cursor: not-allowed; }
    .nx-spin-w {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      animation: spin .65s linear infinite;
    }

    @media (max-width: 680px) {
      .nx-right { display: none; }
      .nx-left  { width: 100%; border-right: none; padding: 32px 24px; }
    }
  `;
  document.head.appendChild(s);
};

/* ── Icons ── */
const IcoBack = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoErr = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.4"/>
    <path d="M8 5v4M8 11h.01" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 8l9 6 9-6M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="#4f46e5" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#4f46e5" strokeWidth="1.4"/>
    <path d="M5 8l2 2 4-4" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoQ = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#9ca3af" strokeWidth="1.4"/>
    <path d="M6.5 6.5a1.5 1.5 0 012.8.6C9.3 8 8 8.5 8 9.5M8 11.5h.01" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const IcoNexus = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L3 6v4c0 3.9 2.9 7.4 7 8.4 4.1-1 7-4.5 7-8.4V6l-7-4z" fill="white" opacity=".9"/>
    <path d="M7 10l2 2 4-4" stroke="#111" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoGoogle = () => (
  <svg width="17" height="17" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9L6.2 33.1C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C44.4 36.2 48 30.5 48 24c0-1.3-.1-2.7-.4-3.9z"/>
  </svg>
);

/* ── Forgot Password Modal ── */
function ForgotModal({ open, onClose }) {
  const [fpEmail, setFpEmail]     = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSuccess, setFpSuccess] = useState(false);
  const [fpError, setFpError]     = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFpEmail(''); setFpSuccess(false); setFpError(''); setFpLoading(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleSend = async () => {
    if (!fpEmail.trim()) { setFpError('Please enter your email address.'); return; }
    setFpLoading(true); setFpError('');
    try {
      // ── Wire your real API here ──
      await api.post('/auth/forgot-password', { email: fpEmail });
      // await new Promise(r => setTimeout(r, 1100)); // placeholder
      setFpSuccess(true);
    } catch (err) {
      setFpError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div className={`nx-modal-bg${open ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal">
        <div className="nx-modal-icon-box"><IcoMail /></div>

        {fpSuccess ? (
          <>
            <h3>Check your inbox</h3>
            <p>
              We sent a reset link to <strong style={{ color: '#111' }}>{fpEmail}</strong>.
              Check your spam folder if it doesn't arrive within a minute.
            </p>
            <button className="nx-m-send" onClick={onClose} style={{ width: '100%' }}>
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h3>Forgot password?</h3>
            <p>
              Enter the email linked to your account and we'll send you a secure
              link to reset your password.
            </p>

            {fpError && (
              <div className="nx-alert err" style={{ marginBottom: 14 }}>
                <IcoErr /> {fpError}
              </div>
            )}

            <label className="nx-label">Email address</label>
            <input
              ref={inputRef}
              type="email"
              className={`nx-input${fpError ? ' err' : ''}`}
              placeholder="you@company.com"
              value={fpEmail}
              onChange={e => { setFpEmail(e.target.value); setFpError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />

            <div className="nx-modal-footer">
              <button className="nx-m-cancel" onClick={onClose} disabled={fpLoading}>Cancel</button>
              <button className="nx-m-send" onClick={handleSend} disabled={fpLoading}>
                {fpLoading ? <><div className="nx-spin-w" /> Sending…</> : 'Send reset link'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Right Panel with carousel ── */
function RightPanel() {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      tag: "What's new",
      title: '15 new integrations added',
      sub: "You asked and we listened! We've added a bunch of new integrations to speed up your workflow.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    {
      tag: 'Productivity',
      title: 'Automate your entire workflow',
      sub: 'Set up powerful automations across your tools — no code required. Save hours every week.',
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop"
    },
    {
      tag: 'Security',
      title: 'Enterprise SSO & 2FA built in',
      sub: 'Secure your team with SAML SSO, multi-factor auth, and full audit logs included on every plan.',
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
    },
  ];

  // Auto cycle slides
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const cur = slides[slide];

  return (
    <div className="nx-right">
      <div className="nx-right-bg" />

      {/* Geometric accents — no blur */}
      <div className="nx-geo nx-geo1" />
      <div className="nx-geo nx-geo2" />
      <div className="nx-geo nx-geo3" />
      <div className="nx-geo nx-geo4" />

      {/* Image Slideshow in place of floating card */}
      <div className="nx-slideshow">
        {slides.map((s, i) => (
          <img
            key={i}
            src={s.image}
            alt={s.title}
            className={`nx-slide-img ${slide === i ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Carousel footer */}
      <div className="nx-right-footer">
        <div className="nx-new-tag">✦ {cur.tag}</div>
        <div className="nx-right-title">{cur.title}</div>
        <div className="nx-right-sub">{cur.sub}</div>
        <div className="nx-carousel-nav">
          <button className="nx-c-btn" onClick={() => setSlide(s => (s - 1 + slides.length) % slides.length)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="nx-dots-wrap">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`nx-dot${slide === i ? ' on' : ''}`}
                style={{ width: slide === i ? 22 : 8 }}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
          <button className="nx-c-btn" onClick={() => setSlide(s => (s + 1) % slides.length)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN LOGIN COMPONENT
══════════════════════════════════════ */
function Login({ setToken, setView }) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [remember, setRemember]   = useState(false);
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { injectFonts(); injectStyles(); }, []);

  /* ── original login logic — untouched ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      console.error('Login failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Google logic with Loader ── */
  const handleGoogleLogin = () => {
    setIsLoading(true);
    const host = window.location.host;
    let backendUrl;
    if (host.includes('cloudworkstations.dev') || host.includes('idx.dev')) {
      backendUrl = `https://${host.replace('3000-', '5000-')}${API_PATH}/auth/login/google`;
    } else {
      backendUrl = `http://localhost:5000${API_PATH}/auth/login/google`;
    }
    console.log('DEBUG: Redirecting to Backend Google Auth:', backendUrl);
    window.location.href = backendUrl;
  };

  if (isLoading) {
    return <PremiumLoader message="Authenticating Credentials..." fullScreen />;
  }

  return (
    <div className="nx-root">
      <div className="nx-card">

        {/* ═══ LEFT ═══ */}
        <div className="nx-left">
          {/* Top bar */}
          <div className="nx-top-bar">
            <div className="nx-logo-wrap">
              <div className="nx-logo-icon"><IcoNexus /></div>
              <span className="nx-logo-name">NexusOS</span>
            </div>
            {/* <button className="nx-back-btn" onClick={() => setView && setView('home')}>
              <IcoBack /> Go back
            </button> */}
          </div>

          {/* Vertically centered form */}
          <div className="nx-form-area">
            <h1 className="nx-heading">Sign in</h1>
            <p className="nx-subheading">
              Enter your email to receive a one-time passcode, or sign in with your password.
            </p>

            {error && (
              <div className="nx-alert err">
                <IcoErr /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="nx-field">
                <div className="nx-field-row">
                  <label className="nx-label" htmlFor="nx-email">Email address</label>
                </div>
                <input
                  id="nx-email"
                  type="email"
                  className={`nx-input${error ? ' err' : ''}`}
                  placeholder="amelie@company.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                />
              </div>

              {/* Password */}
              <div className="nx-field">
                <div className="nx-field-row">
                  <label className="nx-label" htmlFor="nx-pass">Password</label>
                  <button
                    type="button"
                    className="nx-forgot-link"
                    onClick={() => setShowModal(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="nx-pass"
                  type="password"
                  className={`nx-input${error ? ' err' : ''}`}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                />
              </div>

              {/* Remember toggle */}
              <div className="nx-toggle-row">
                <label className="nx-toggle">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  <span className="nx-slider" />
                </label>
                <span className="nx-toggle-label" onClick={() => setRemember(r => !r)}>
                  Remember me for 30 days
                </span>
              </div>

              {/* Sign in */}
              <button type="submit" className="nx-btn-primary" disabled={isLoading}>
                {isLoading
                  ? <><div className="nx-spin" /> Signing in…</>
                  : 'Sign in to workspace'}
              </button>
            </form>

            <div className="nx-divider"><span>or</span></div>

            {/* Google */}
            <button className="nx-btn-secondary" onClick={handleGoogleLogin}>
              <IcoGoogle /> Sign in with Google
            </button>

            {/* Register */}
            <div className="nx-left-footer" style={{ marginTop: 28 }}>
              Need an account?
              <button type="button" onClick={() => setView('register')}>Register here</button>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT ═══ */}
        <RightPanel />
      </div>

      {/* Forgot Password Modal */}
      <ForgotModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default Login;