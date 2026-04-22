import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { FiImage, FiSettings, FiBriefcase, FiAperture, FiMail, FiActivity, FiGlobe, FiPhone, FiMapPin, FiCheckCircle, FiShield, FiUpload } from 'react-icons/fi';
import PremiumLoader from '../PremiumLoader';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

function OrganizationProfile() {
    const { token, user } = useAuth();
    const [companyInfo, setCompanyInfo] = useState(null);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');

    // Details state
    const [details, setDetails] = useState({ name: '', domain: '', phone: '', address: '', website: '' });
    const [detailsStatus, setDetailsStatus] = useState('');

    // Theme and Mail state
    const [themeColors, setThemeColors] = useState({ primary: '', secondary: '', accent: '', bg: '', text: '' });
    const [mailConfig, setMailConfig] = useState({ host: '', port: '', user: '', pass: '', from: '' });
    const [themeStatus, setThemeStatus] = useState('');
    const [mailStatus, setMailStatus] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const companyRes = await api.get('/company/me');
                setCompanyInfo(companyRes.data);
                setDetails({
                    name: companyRes.data.name || '',
                    domain: companyRes.data.domain || '',
                    phone: companyRes.data.phone || '',
                    address: companyRes.data.address || '',
                    website: companyRes.data.website || ''
                });
                setUserRoles(user?.roles || []);
                setThemeColors({ 
                    primary: companyRes.data.theme_primary_color || '', 
                    secondary: companyRes.data.theme_secondary_color || '',
                    accent: companyRes.data.theme_accent_color || '',
                    bg: companyRes.data.theme_bg_color || '',
                    text: companyRes.data.theme_text_color || ''
                });
                
                if (user?.roles?.includes('superadmin')) {
                    setMailConfig({
                        host: companyRes.data.smtp_host || '',
                        port: companyRes.data.smtp_port || '',
                        user: companyRes.data.smtp_username || '',
                        pass: '',
                        from: companyRes.data.smtp_from_email || ''
                    });
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load organization profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [token, user]);

    const isSuperAdmin = userRoles.includes('superadmin');

    const handleUpload = async (file) => {
        const fileToUpload = file || selectedFile;
        if (!fileToUpload) return;
        
        const form = new FormData();
        form.append('logo', fileToUpload);
        
        try {
            setUploadStatus('Synchronizing Identity...');
            await api.post('/uploads/company-logo', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus('Identity Insignia Engaged!');
            setSelectedFile(null);
            
            const res = await api.get('/company/me');
            setCompanyInfo(res.data);
            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err) {
            setUploadStatus('Upload request dropped.');
            setTimeout(() => setUploadStatus(''), 3000);
        }
    };

    const handleDetailsUpdate = async () => {
        try {
            setDetailsStatus('Updating...');
            await api.put('/company/me', details);
            setDetailsStatus('Directory Updated!');
            setCompanyInfo({...companyInfo, ...details});
            setTimeout(() => setDetailsStatus(''), 3000);
        } catch (err) {
            setDetailsStatus('Update failed.');
        }
    };

    const handleThemeUpdate = async () => {
        try {
            setThemeStatus('Updating...');
            await api.post('/company/theme', {
                theme_primary_color: themeColors.primary,
                theme_secondary_color: themeColors.secondary,
                theme_accent_color: themeColors.accent,
                theme_bg_color: themeColors.bg,
                theme_text_color: themeColors.text
            });
            setThemeStatus('Success!');
            setTimeout(() => setThemeStatus(''), 3000);
        } catch (err) {
            setThemeStatus('Update failed.');
        }
    };

    const handleMailUpdate = async () => {
        try {
            setMailStatus('Updating...');
            await api.post('/company/mail-config', {
                smtp_host: mailConfig.host,
                smtp_port: mailConfig.port,
                smtp_username: mailConfig.user,
                smtp_password: mailConfig.pass,
                smtp_from_email: mailConfig.from
            });
            setMailStatus('Success!');
            setTimeout(() => setMailStatus(''), 3000);
        } catch (err) {
            setMailStatus('Update failed.');
        }
    };

    if (loading) return <PremiumLoader message="Syncing Enterprise Subsystems..." />;
    if (error) return <div className="p-8 text-center text-red-500 font-black uppercase tracking-widest">{error}</div>;

    return (
        <div className="nx-ts-animate w-full flex flex-col gap-6 pb-12">
            
            {/* --- COMMAND CENTER HEADER --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-3xl border border-gray-100 shadow-[0_20px_50px_var(--theme-primary-rgb-low)]"
            >
                {/* PRIMARY IDENTITY HEADER */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[var(--theme-primary)] text-white rounded-t-3xl border-b border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black tracking-tight">
                                {companyInfo?.name || 'Enterprise Matrix'}
                            </h1>
                            <div className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase text-white/90 tracking-tighter">Strategic Profile</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                            Enterprise Parameters & Active Framework Identity
                        </p>
                    </div>

                    {!isSuperAdmin && (
                        <div className="relative z-10 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <FiShield className="text-yellow-400" /> Protected View
                        </div>
                    )}

                    {/* Background decorations */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                </div>

                {/* ENTERPRISE INTELLIGENCE STRIP */}
                <div className="bg-gray-50/30 px-6 py-4 sm:px-8 flex flex-wrap items-center gap-10 border-b border-gray-50 uppercase">
                    <div className="flex items-center gap-3">
                        <FiGlobe className="text-[var(--theme-primary)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-gray-400 tracking-widest block leading-none mb-1">Root Domain</span>
                            <span className="text-sm font-black text-gray-700">{companyInfo?.domain || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiCheckCircle className="text-emerald-500" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-gray-400 tracking-widest block leading-none mb-1">Status</span>
                            <span className="text-sm font-black text-gray-700 uppercase">Network Active</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiPhone className="text-[var(--theme-primary)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-gray-400 tracking-widest block leading-none mb-1">Support</span>
                            <span className="text-sm font-black text-gray-700">{companyInfo?.phone || 'Central Registry'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        {/* LEFT COLUMN: IDENTITY NODE */}
                        <div className="lg:col-span-4 flex flex-col gap-8 text-center sm:text-left">
                            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col items-center group transition-all hover:shadow-xl hover:shadow-[var(--theme-primary)]/10">
                                <div className="relative mb-6">
                                    <div className="w-40 h-40 rounded-[40px] bg-gray-50 border border-gray-100 p-3 shadow-lg flex items-center justify-center overflow-hidden">
                                        {companyInfo?.logo_original_url ? (
                                            <img src={companyInfo.logo_original_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <span className="text-5xl font-black text-[var(--theme-primary)]">{companyInfo?.name?.[0] || 'E'}</span>
                                        )}
                                        
                                        {isSuperAdmin && (
                                            <div 
                                                className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white flex-col cursor-pointer"
                                                onClick={() => document.getElementById('logo-up').click()}
                                            >
                                                <FiUpload size={32} className="mb-2" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Update Insignia</span>
                                            </div>
                                        )}
                                    </div>
                                    {isSuperAdmin && <input type="file" id="logo-up" className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />}
                                </div>
                                
                                <h3 className="text-lg font-black text-gray-800 tracking-tight mb-2">Corporate Identity</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">System-wide appearance for all nodes and communications.</p>
                                
                                {uploadStatus && (
                                    <div className={`mt-4 w-full p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${uploadStatus.includes('dropped') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {uploadStatus}
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-100 pb-2">Active Protocol Space</h4>
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                        <span className="text-[9px] font-black text-gray-300 uppercase block mb-1">Portal URL</span>
                                        <span className="text-[13px] font-bold text-gray-500 break-all">{companyInfo?.website || 'https://hrms.corporate.local'}</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                        <span className="text-[9px] font-black text-gray-300 uppercase block mb-1">HQ Locator</span>
                                        <span className="text-[13px] font-bold text-gray-500">{companyInfo?.address || 'Operational Command Center'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: STRATEGIC REGISTRY BLOCK */}
                        <div className="lg:col-span-8 flex flex-col gap-10">
                            
                            {/* BLOCK A: GLOBAL DIRECTORY PROFILE */}
                            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col group transition-all hover:shadow-xl hover:shadow-[var(--theme-primary)]/10">
                                <h3 className="text-[16px] font-black text-gray-800 mb-8 flex items-center border-b border-gray-50 pb-4 uppercase tracking-[0.1em]">
                                    <FiBriefcase className="mr-3 text-[var(--theme-primary)]" size={18} /> Global Directory Profile
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Registered Entity Name</label>
                                        <input 
                                            disabled={!isSuperAdmin}
                                            type="text" 
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700 disabled:opacity-50"
                                            value={details.name}
                                            onChange={e => setDetails({...details, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Primary Namespace Domain</label>
                                        <input 
                                            disabled={!isSuperAdmin}
                                            type="text" 
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700 disabled:opacity-50"
                                            value={details.domain}
                                            onChange={e => setDetails({...details, domain: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Support Terminal (Phone)</label>
                                        <input 
                                            disabled={!isSuperAdmin}
                                            type="text" 
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700 disabled:opacity-50"
                                            value={details.phone}
                                            onChange={e => setDetails({...details, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Corporate Web Portal</label>
                                        <input 
                                            disabled={!isSuperAdmin}
                                            type="text" 
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700 disabled:opacity-50"
                                            value={details.website}
                                            onChange={e => setDetails({...details, website: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Physical HQ Locator (Address)</label>
                                        <input 
                                            disabled={!isSuperAdmin}
                                            type="text" 
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700 disabled:opacity-50"
                                            value={details.address}
                                            onChange={e => setDetails({...details, address: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {isSuperAdmin && (
                                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-8">
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${detailsStatus.includes('failed') ? 'text-red-500' : 'text-emerald-500'}`}>{detailsStatus}</p>
                                        <button 
                                            onClick={handleDetailsUpdate}
                                            disabled={detailsStatus === 'Updating...'}
                                            className="px-8 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--theme-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            {detailsStatus === 'Updating...' ? 'Sync...' : 'Synchronize Directory'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* BLOCK B: INTERFACE TOKEN DESIGN */}
                            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col group transition-all hover:shadow-xl hover:shadow-[var(--theme-primary)]/10">
                                <h3 className="text-[16px] font-black text-gray-800 mb-8 flex items-center border-b border-gray-50 pb-4 uppercase tracking-[0.1em]">
                                    <FiAperture className="mr-3 text-[var(--theme-primary)]" size={18} /> Interface Token Design
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                    {[
                                        { label: 'Primary', key: 'primary', val: themeColors.primary },
                                        { label: 'Secondary', key: 'secondary', val: themeColors.secondary },
                                        { label: 'Accent', key: 'accent', val: themeColors.accent },
                                        { label: 'Canvas', key: 'bg', val: themeColors.bg },
                                        { label: 'Text', key: 'text', val: themeColors.text }
                                    ].map(item => (
                                        <div key={item.key} className="flex flex-col items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 h-4 text-center">{item.label}</span>
                                            {isSuperAdmin ? (
                                                <input 
                                                    type="color" 
                                                    value={item.val || '#ffffff'}
                                                    onChange={(e) => setThemeColors({...themeColors, [item.key]: e.target.value})}
                                                    className="w-12 h-12 rounded-xl cursor-pointer p-0 border-0 bg-transparent overflow-hidden mb-3"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl shadow-sm mb-3 border border-white" style={{ backgroundColor: item.val }}></div>
                                            )}
                                            <span className="font-mono text-[10px] text-gray-400 font-bold uppercase">{item.val || '---'}</span>
                                        </div>
                                    ))}
                                </div>

                                {isSuperAdmin && (
                                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-8">
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${themeStatus.includes('failed') ? 'text-red-500' : 'text-emerald-500'}`}>{themeStatus}</p>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setThemeColors({ primary: '#3730A3', secondary: '#d3d1ff', accent: '#818CF8', bg: '#F9FAFB', text: '#1F2937' })}
                                                className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                                            >
                                                Defaults
                                            </button>
                                            <button 
                                                onClick={handleThemeUpdate}
                                                disabled={themeStatus === 'Updating...'}
                                                className="px-8 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--theme-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Deploy Topology
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BLOCK C: SMTP NETWORKING MODULE */}
                            {isSuperAdmin && (
                                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col group transition-all hover:shadow-xl hover:shadow-[var(--theme-primary)]/10">
                                    <h3 className="text-[16px] font-black text-gray-800 mb-8 flex items-center border-b border-gray-50 pb-4 uppercase tracking-[0.1em]">
                                        <FiMail className="mr-3 text-[var(--theme-primary)]" size={18} /> Encrypted Mail Node Setup
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">SMTP Relay Host</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700"
                                                placeholder="smtp.example.com"
                                                value={mailConfig.host}
                                                onChange={e => setMailConfig({...mailConfig, host: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Relay Port</label>
                                            <input 
                                                type="number" 
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700"
                                                placeholder="587"
                                                value={mailConfig.port}
                                                onChange={e => setMailConfig({...mailConfig, port: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Remote Access Key (User)</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700"
                                                placeholder="proxy_user@domain"
                                                value={mailConfig.user}
                                                onChange={e => setMailConfig({...mailConfig, user: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Security Token (Pass)</label>
                                            <input 
                                                type="password" 
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700 font-mono"
                                                placeholder="••••••••••••"
                                                value={mailConfig.pass}
                                                onChange={e => setMailConfig({...mailConfig, pass: e.target.value})}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Alias Broadcaster Address</label>
                                            <input 
                                                type="email" 
                                                className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-gray-700"
                                                placeholder="operations@system.ai"
                                                value={mailConfig.from}
                                                onChange={e => setMailConfig({...mailConfig, from: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-8">
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${mailStatus.includes('failed') ? 'text-red-500' : 'text-emerald-500'}`}>{mailStatus}</p>
                                        <button 
                                            onClick={handleMailUpdate}
                                            disabled={mailStatus === 'Updating...'}
                                            className="px-8 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--theme-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {mailStatus === 'Updating...' ? 'Locking...' : 'Lock Gateway Settings'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default OrganizationProfile;
