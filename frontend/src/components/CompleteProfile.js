import React, { useState, useEffect } from 'react';
import LogoUploader from './onboarding/LogoUploader';
import { api } from '../utils/api';
import PremiumLoader from './PremiumLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiChevronRight, FiMapPin, FiPhone, FiGlobe } from 'react-icons/fi';

/* ─── Global Styles Injection for Layout Consistency ─── */
const injectStyles = () => {
    if (document.getElementById('nx-onboard-styles')) return;
    const s = document.createElement('style');
    s.id = 'nx-onboard-styles';
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
        box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.08); /* Sophisticated SaaS shadow */
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
      
      .nx-color-block { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; display: flex; align-items: center; transition: all .2s; cursor: pointer; }
      .nx-color-block:hover { border-color: #cbd5e1; background: #f8fafc; }
      .nx-color-picker { width: 24px; height: 24px; border: none; border-radius: 6px; cursor: pointer; padding: 0; background: none; }
      .nx-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
      .nx-color-picker::-webkit-color-swatch { border: none; border-radius: 6px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); }
      .nx-color-hex { flex: 1; padding: 4px 8px; border: none; background: transparent; font-size: 13px; font-weight: 600; color: #475569; outline: none; text-transform: uppercase; font-family: monospace; }
  
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
        background: var(--theme-primary);
        opacity: 0.95; 
      }
      .nx-abstract-circ { position: absolute; width: 600px; height: 600px; border-radius: 50%; opacity: 0.03; border: 1px solid #fff; left: -100px; top: -100px; }
      .nx-abstract-circ-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; opacity: 0.05; border: 1px solid #fff; right: -50px; bottom: -50px; }
      
      .nx-stepper { display: flex; gap: 8px; margin-bottom: 40px; }
      .nx-step { flex: 1; height: 4px; border-radius: 4px; background: #e2e8f0; transition: background 0.4s ease; }
      .nx-step.active { background: #3730A3; }
  
      @media (max-width: 860px) {
        .nx-right { display: none; }
        .nx-left  { width: 100%; border-right: none; padding: 32px 24px; }
      }
    `;
    document.head.appendChild(s);
  };

function CompleteProfile({ setToken }) {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    website: '',
    theme_primary_color: '#3730A3', 
    theme_secondary_color: '#e0e7ff',
    theme_accent_color: '#1e293b', 
    theme_bg_color: '#f0f4f8',
    theme_text_color: '#0f172a'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    injectStyles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/onboarding/complete-profile/details', formData);
      
      if (response.data && response.data.company_id) {
        setCompanyId(response.data.company_id);
      } else {
        throw new Error("Failed to configure environment details.");
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Configuration error. Please verify your variables.');
    } finally {
      setIsLoading(false);
    }
  };

  const EnterpriseColorInput = ({ label, name, value }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempColor, setTempColor] = useState(value);
    
    // Sync temp color if external value changes while open
    useEffect(() => { setTempColor(value); }, [value]);

    const handleConfirm = (e) => {
        e.preventDefault();
        handleChange({ target: { name, value: tempColor } });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <label className="nx-label flex items-center justify-between">
                {label} 
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded">Pick</span>
            </label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="nx-color-block relative flex items-center p-1 cursor-pointer border border-gray-200 rounded-xl bg-white shadow-sm hover:border-[var(--theme-primary)] transition-colors"
            >
                <div className="w-9 h-9 rounded-lg shadow-inner border border-gray-200" style={{ backgroundColor: value }}></div>
                <div className="ml-3 flex-1 font-medium text-gray-700 bg-transparent text-[14px] uppercase">{value}</div>
            </div>

            {/* Custom Popover with OK functionality */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-50 top-full mt-2 left-0 w-64 p-4 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-gray-100"
                    >
                        <h4 className="text-sm font-bold text-gray-800 mb-3 tracking-tight">Select Corporate Value</h4>
                        
                        <div className="flex items-center gap-3 mb-5">
                            {/* The massive isolated native picker */}
                            <div className="relative w-14 h-14 rounded-xl shadow-inner border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer">
                                <input 
                                    type="color" 
                                    value={tempColor} 
                                    onChange={(e) => setTempColor(e.target.value)} 
                                    className="absolute -top-5 -left-5 w-24 h-24 cursor-pointer opacity-0"
                                />
                                <div className="w-full h-full pointer-events-none" style={{ backgroundColor: tempColor }}></div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Hex Code</label>
                                <input 
                                    type="text" 
                                    value={tempColor} 
                                    onChange={(e) => setTempColor(e.target.value)} 
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-[var(--theme-primary)]" 
                                    maxLength={7} 
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); setIsOpen(false); setTempColor(value); }} 
                                className="flex-1 px-4 py-2 bg-gray-50 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] border border-gray-200 text-gray-600 font-semibold rounded-lg text-[13px] transition-colors"
                            >
                                Cancel
                           </button>
                           <button 
                                type="button" 
                                onClick={handleConfirm} 
                                className="flex-1 px-4 py-2 bg-[var(--theme-primary,#3730A3)] text-white font-bold rounded-lg text-[13px] hover:brightness-95 transition-all shadow-md"
                            >
                                OK
                           </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
  };

  if (isLoading) {
      return <PremiumLoader message="Configuring Workspace Environment..." fullScreen={true} />;
  }

  return (
    <div className="nx-root">
      <div className="nx-card">
        
        {/* LEFT / FORMS SECTION */}
        <div className="nx-left">
          <div className="nx-form-area">
            
            {/* Stepper tracking */}
            <div className="nx-stepper">
                <div className="nx-step active" />
                <div className={`nx-step ${companyId ? 'active' : ''}`} />
            </div>

            <AnimatePresence mode="wait">
              {!companyId ? (
                /* ─── STEP 1: ORGANIZATION DATA ─── */
                <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    <h1 className="nx-heading">Organization Data</h1>
                    <p className="nx-subheading">Establish your company's core routing profile and aesthetic identity for seamless tenant deployment.</p>

                    <form onSubmit={handleSubmit}>
                        {/* Location */}
                        <div className="nx-field">
                            <label className="nx-label">Corporate Address</label>
                            <div className="nx-input-wrap">
                                <FiMapPin className="nx-input-icon" />
                                <input name="address" type="text" required placeholder="Floor 5, 2300 Enterprise Way..." className="nx-input" value={formData.address} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Split Logic */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="nx-field">
                                <label className="nx-label">Support Number</label>
                                <div className="nx-input-wrap">
                                    <FiPhone className="nx-input-icon" />
                                    <input name="phone" type="tel" required placeholder="(555) 123-4567" className="nx-input" value={formData.phone} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="nx-field">
                                <label className="nx-label">Primary Domain</label>
                                <div className="nx-input-wrap">
                                    <FiGlobe className="nx-input-icon" />
                                    <input name="website" type="url" required placeholder="https://domain.com" className="nx-input" value={formData.website} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* Brand Engine Section */}
                        <div className="mt-8 mb-4">
                            <h3 className="text-[15px] font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--theme-primary,#3730A3)]" /> Identity Engine
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">Define your foundational CSS variables for the workspace dashboard UI.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <EnterpriseColorInput label="Primary Accent" name="theme_primary_color" value={formData.theme_primary_color} />
                            <EnterpriseColorInput label="Base Background" name="theme_bg_color" value={formData.theme_bg_color} />
                            <EnterpriseColorInput label="Light Accent" name="theme_secondary_color" value={formData.theme_secondary_color} />
                            <EnterpriseColorInput label="Bold Text" name="theme_text_color" value={formData.theme_text_color} />
                            <div className="col-span-2">
                                <EnterpriseColorInput label="Secondary Accent" name="theme_accent_color" value={formData.theme_accent_color} />
                            </div>
                        </div>

                        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium mb-4 flex items-center gap-2">{error}</div>}

                        <button type="submit" className="nx-btn-primary">
                            Configure Identity <FiChevronRight size={18} />
                        </button>
                    </form>
                </motion.div>
              ) : (
                /* ─── STEP 2: LOGO UPLOADER OVERRIDE ─── */
                <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                     <h1 className="nx-heading">Visual Asset</h1>
                     <p className="nx-subheading">Your identity has been established. Finalize setup by uploading your corporate logo.</p>
                     
                     {/* The Logo Uploader integrates seamlessly with no full-page reloads */}
                     <LogoUploader companyId={companyId} setToken={setToken} />
                </motion.div>
              )}
            </AnimatePresence>

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
                                <h4 className="text-white font-bold text-lg tracking-tight">Enterprise Standard</h4>
                                <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Global Network</p>
                            </div>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed font-medium">Your customized onboarding process builds an isolated, branded, highly secure ecosystem explicitly tailored to your corporate taxonomy.</p>
                    </motion.div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default CompleteProfile;
