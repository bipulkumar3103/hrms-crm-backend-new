import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import { FiBriefcase, FiGlobe, FiChevronRight, FiCheckCircle } from 'react-icons/fi';

/* ─── Global Styles Injection for Layout Consistency ─── */
const injectStyles = () => {
    if (document.getElementById('nx-onboard-google-styles')) return;
    const s = document.createElement('style');
    s.id = 'nx-onboard-google-styles';
    s.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
      .nx-root {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        min-height: 100vh;
        background: #f0f4f8;
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
        -webkit-font-smoothing: antialiased;
      }
  
      .nx-card {
        display: flex; width: 100%; max-width: 1060px; min-height: 640px;
        border-radius: 24px; overflow: hidden; background: #fff;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.08); 
      }
  
      .nx-left {
        width: 50%; background: #fff; display: flex; flex-direction: column;
        padding: 48px; border-right: 1px solid #f1f5f9; position: relative;
      }
  
      .nx-form-area {
        flex: 1; display: flex; flex-direction: column; justify-content: center;
        width: 100%; max-width: 400px; margin: 0 auto;
      }
  
      .nx-heading { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.7px; line-height: 1.15; margin-bottom: 8px; }
      .nx-subheading { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 32px; font-weight: 500; }
  
      .nx-field { margin-bottom: 16px; }
      .nx-label { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block; }
      
      .nx-input-wrap { position: relative; display: flex; align-items: center; }
      .nx-input-icon { position: absolute; left: 14px; color: #94a3b8; }
      .nx-input {
        width: 100%; height: 44px; padding: 0 14px 0 40px;
        border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 500;
        color: #0f172a; background: #fff; outline: none; transition: all .2s ease;
      }
      .nx-input::placeholder { color: #94a3b8; font-weight: 400; }
      .nx-input:focus { border-color: #3730A3; box-shadow: 0 0 0 4px rgba(55,48,163,0.1); }
  
      .nx-btn-primary {
        width: 100%; height: 46px; background: #3730A3; border: none; border-radius: 10px;
        color: #fff; font-size: 14.5px; font-weight: 700; cursor: pointer;
        transition: all .2s ease; display: flex; align-items: center; justify-content: center; gap: 8px;
        box-shadow: 0 4px 12px rgba(55,48,163,0.25); margin-top: 10px;
      }
      .nx-btn-primary:hover:not(:disabled) { background: #312E81; box-shadow: 0 6px 16px rgba(55,48,163,0.35); transform: translateY(-1px); }
      .nx-btn-primary:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 8px rgba(55,48,163,0.25); }
      .nx-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  
      /* Right Panel Split */
      .nx-right {
        flex: 1; background: #1e1b4b; position: relative; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden;
      }
      .nx-right-bg { 
        position: absolute; inset: 0; 
        background: linear-gradient(145deg, #020617 0%, #1e1b4b 40%, #312E81 80%, #3730A3 100%);
        opacity: 0.95; 
      }
      .nx-abstract-circ { position: absolute; width: 600px; height: 600px; border-radius: 50%; opacity: 0.03; border: 1px solid #fff; left: -100px; top: -100px; }
      .nx-abstract-circ-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; opacity: 0.05; border: 1px solid #fff; right: -50px; bottom: -50px; }
      
      @media (max-width: 860px) {
        .nx-right { display: none; }
        .nx-left  { width: 100%; border-right: none; padding: 32px 24px; }
      }
    `;
    document.head.appendChild(s);
};

const OnboardingGoogle = ({ api, saveToken }) => {
    const [companyName, setCompanyName] = useState('');
    const [companyDomain, setCompanyDomain] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        injectStyles();
        
        // Attempt to suggest a domain based on the user's email from the JWT
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.sub && decoded.sub.includes('@')) {
                    const emailDomain = decoded.sub.split('@')[1];
                    // Basic filter to avoid common public providers as suggestions
                    const commonProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'hotmail.com'];
                    if (!commonProviders.includes(emailDomain.toLowerCase())) {
                        setCompanyDomain(emailDomain);
                    }
                }
            } catch (e) {
                console.error("Error decoding token for domain suggestion", e);
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!companyName || !companyDomain) {
            setError('Please fill in both the company name and domain.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/onboarding/google/create-company', {
                company_name: companyName,
                company_domain: companyDomain
            });

            if (response.data && response.data.access_token) {
                // Save the new token which now includes the company_id and superadmin role
                saveToken(response.data.access_token);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create company. Please try again.';
            setError(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="nx-root">
            <div className="nx-card">
                
                {/* LEFT / FORMS SECTION */}
                <div className="nx-left">
                    <div className="nx-form-area">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="nx-heading">Create Workspace</h1>
                            <p className="nx-subheading">You have successfully authenticated via Google. Set up your organization's root namespace to continue.</p>

                            <form onSubmit={handleSubmit}>
                                <div className="nx-field">
                                    <label className="nx-label">Corporate Entity Name</label>
                                    <div className="nx-input-wrap">
                                        <FiBriefcase className="nx-input-icon" />
                                        <input
                                            type="text"
                                            required
                                            className="nx-input"
                                            placeholder="Acme Global Inc."
                                            value={companyName}
                                            onChange={(e) => {setCompanyName(e.target.value); setError('');}}
                                        />
                                    </div>
                                </div>

                                <div className="nx-field mb-8">
                                    <label className="nx-label">Internal Registration Domain</label>
                                    <div className="nx-input-wrap">
                                        <FiGlobe className="nx-input-icon" />
                                        <input
                                            type="text"
                                            required
                                            className="nx-input"
                                            placeholder="acmeglobal.com"
                                            value={companyDomain}
                                            onChange={(e) => {setCompanyDomain(e.target.value); setError('');}}
                                        />
                                    </div>
                                    <p className="mt-2 text-[11px] font-medium text-gray-400 uppercase tracking-widest pl-2">
                                        Future peers binding via Google Auth with this domain will align seamlessly to this workspace.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium mb-4 flex items-start gap-2">
                                        <span className="mt-0.5">⚠️</span> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="nx-btn-primary"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
                                            Provisioning Root...
                                        </>
                                    ) : (
                                        <>Initialize Enterprise <FiChevronRight size={18} /></>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT / VISUAL PRESENTATION SECTION */}
                <div className="nx-right">
                    <div className="nx-right-bg" />
                    <div className="nx-abstract-circ" />
                    <div className="nx-abstract-circ-2" />
                    
                    <div className="relative z-10 w-full h-full flex flex-col justify-end p-12 overflow-hidden">
                        <div className="mb-8">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-[400px]"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <FiCheckCircle className="text-green-400" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg tracking-tight">Access Granted</h4>
                                        <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Federated Identity</p>
                                    </div>
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed font-medium">Your federated OAuth identity from Google has been accepted. Link your identity to an organization partition to complete onboarding.</p>
                            </motion.div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OnboardingGoogle;
