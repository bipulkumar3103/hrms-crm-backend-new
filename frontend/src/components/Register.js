import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiMail, FiGlobe } from 'react-icons/fi';
import { useAlert } from '../context/AlertContext';

/* ── Custom hook for debouncing input ── */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

/* ── Icons ── */
const IcoNexus = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L3 6v4c0 3.9 2.9 7.4 7 8.4 4.1-1 7-4.5 7-8.4V6l-7-4z" fill="white" opacity=".9"/>
    <path d="M7 10l2 2 4-4" stroke="#111" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoErr = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.4"/>
    <path d="M8 5v4M8 11h.01" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoOk = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M5 8.5l2 2 4-4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoFailed = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M11 5L5 11M5 5l6 6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

/* ── Validation Helper ── */
const ValidationIcon = ({ status }) => {
  if (status === 'checking') return <div className="nx-icon-right"><div className="nx-spin-dark" /></div>;
  if (status === 'valid')    return <div className="nx-icon-right"><IcoOk /></div>;
  if (status === 'invalid')  return <div className="nx-icon-right"><IcoFailed /></div>;
  return null;
};

/* ── Right Panel with slides ── */
function RightPanel() {
  const [slide, setSlide] = useState(0);
  const slides = [
    {
      tag: 'Team Management',
      title: 'Built for enterprise scale',
      sub: 'Manage thousands of team members, roles, and permissions securely and effortlessly.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
    },
    {
      tag: 'Productivity',
      title: 'Automate your entire workflow',
      sub: 'Set up powerful automations across your tools — no code required. Save hours every week.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop'
    },
    {
      tag: 'Security',
      title: 'Enterprise SSO & 2FA built in',
      sub: 'Secure your team with SAML SSO, multi-factor auth, and full audit logs included on every plan.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop'
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const cur = slides[slide];

  return (
    <div className="nx-right">
      <div className="nx-right-bg" />
      <div className="nx-geo nx-geo1" />
      <div className="nx-geo nx-geo2" />
      <div className="nx-geo nx-geo3" />
      <div className="nx-geo nx-geo4" />

      <div className="nx-slideshow">
        {slides.map((s, i) => (
          <img key={i} src={s.image} alt={s.title} className={`nx-slide-img ${slide === i ? 'active' : ''}`} />
        ))}
      </div>

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
              <div key={i} className={`nx-dot${slide === i ? ' on' : ''}`} style={{ width: slide === i ? 22 : 8 }} onClick={() => setSlide(i)} />
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
   MAIN REGISTER COMPONENT
══════════════════════════════════════ */
function Register({ setView }) {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({ company_name: '', company_domain: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState({
    domain: { status: 'idle', message: '' },
    email:  { status: 'idle', message: '' }
  });

  const debouncedDomain = useDebounce(formData.company_domain, 500);
  const debouncedEmail = useDebounce(formData.email, 500);

  useEffect(() => { /* fonts & styles loaded globally via nx-styles.css */ }, []);


  const checkAvailability = useCallback(async (field, value) => {
    if (value.trim() === '') {
      setValidation(prev => ({ ...prev, [field]: { status: 'idle', message: '' } }));
      return;
    }
    setValidation(prev => ({ ...prev, [field]: { status: 'checking', message: '' } }));
    try {
      const { data } = await api.post('/auth/check-availability', { field, value });
      if (data.available) {
        setValidation(prev => ({ ...prev, [field]: { status: 'valid', message: '' } }));
      } else {
        setValidation(prev => ({ ...prev, [field]: { status: 'invalid', message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken.` } }));
      }
    } catch (error) {
      setValidation(prev => ({ ...prev, [field]: { status: 'invalid', message: 'Error checking availability.' } }));
    }
  }, []);

  useEffect(() => { if (debouncedDomain) checkAvailability('domain', debouncedDomain); }, [debouncedDomain, checkAvailability]);
  useEffect(() => { if (debouncedEmail) checkAvailability('email', debouncedEmail); }, [debouncedEmail, checkAvailability]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const canSubmit =
    formData.company_name &&
    formData.password &&
    validation.domain.status === 'valid' &&
    validation.email.status === 'valid';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setFormError('Please fix the errors before submitting.');
      return;
    }
    setIsLoading(true); setFormError('');
    try {
      await api.post('/auth/register', formData);
      showAlert('Registration successful! Please log in to continue.', 'success');
      if(setView) setView('login');
    } catch (err) {
      setFormError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nx-root">
      <div className="nx-card">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="nx-left">
          <div className="nx-top-bar">
            <div className="nx-logo-wrap">
              <div className="nx-logo-icon"><IcoNexus /></div>
              <span className="nx-logo-name">NexusOS</span>
            </div>
          </div>

          <div className="nx-form-area" style={{ maxWidth: 360 }}>
            <h1 className="nx-heading" style={{ fontSize: 24 }}>Create your account</h1>
            <p className="nx-subheading">Sign up to bring your team together in one workspace.</p>

            {formError && (
              <div className="nx-alert err">
                <IcoErr /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* Company Name */}
              <div className="nx-field" style={{ marginBottom: 16 }}>
                <div className="nx-field-row"><label className="nx-label">Company Name</label></div>
                <input
                  name="company_name" type="text" placeholder="Acme Inc." required
                  className="nx-input"
                  value={formData.company_name} onChange={handleChange}
                />
              </div>

              {/* Company Domain */}
              <div className="nx-field" style={{ marginBottom: 16 }}>
                <div className="nx-field-row">
                  <label className="nx-label">Company Domain</label>
                  {validation.domain.message && (
                    <span style={{ fontSize: 11, color: '#ef4444' }}>{validation.domain.message}</span>
                  )}
                </div>
                <input
                  name="company_domain" type="text" placeholder="acme.com" required
                  className={`nx-input ${validation.domain.status === 'invalid' ? 'err' : ''} ${validation.domain.status === 'valid' ? 'ok' : ''}`}
                  value={formData.company_domain} onChange={handleChange}
                />
                <ValidationIcon status={validation.domain.status} />
              </div>

              {/* Admin Email */}
              <div className="nx-field" style={{ marginBottom: 16 }}>
                <div className="nx-field-row">
                  <label className="nx-label">Admin Email</label>
                  {validation.email.message && (
                    <span style={{ fontSize: 11, color: '#ef4444' }}>{validation.email.message}</span>
                  )}
                </div>
                <input
                  name="email" type="email" placeholder="you@company.com" required
                  className={`nx-input ${validation.email.status === 'invalid' ? 'err' : ''} ${validation.email.status === 'valid' ? 'ok' : ''}`}
                  value={formData.email} onChange={handleChange}
                />
                <ValidationIcon status={validation.email.status} />
              </div>

              {/* Password */}
              <div className="nx-field" style={{ marginBottom: 0 }}>
                <div className="nx-field-row"><label className="nx-label">Password</label></div>
                <input
                  name="password" type="password" placeholder="••••••••" required
                  className="nx-input"
                  value={formData.password} onChange={handleChange}
                />
              </div>

              <button type="submit" className="nx-btn-primary mt-4" disabled={!canSubmit || isLoading}>
                {isLoading ? <><div className="nx-spin" /> Creating Account…</> : 'Create Company Workspace'}
              </button>

            </form>

            <div className="nx-left-footer" style={{ marginTop: 12 }}>
              Already have an account?
              <button type="button" onClick={() => setView && setView('login')}>Sign in here</button>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <RightPanel />

      </div>
    </div>
  );
}

export default Register;
