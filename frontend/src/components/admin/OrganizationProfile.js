import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { FiImage, FiSettings, FiBriefcase, FiAperture, FiMail } from 'react-icons/fi';
import PremiumLoader from '../PremiumLoader';

function OrganizationProfile({ token }) {
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
                // Fetch company data and user data concurrently
                const [companyRes, userRes] = await Promise.all([
                    api.get('/company/me'),
                    api.get('/users/me')
                ]);
                setCompanyInfo(companyRes.data);
                setDetails({
                    name: companyRes.data.name || '',
                    domain: companyRes.data.domain || '',
                    phone: companyRes.data.phone || '',
                    address: companyRes.data.address || '',
                    website: companyRes.data.website || ''
                });
                setUserRoles(userRes.data.roles || []);
                setThemeColors({ 
                    primary: companyRes.data.theme_primary_color || '', 
                    secondary: companyRes.data.theme_secondary_color || '',
                    accent: companyRes.data.theme_accent_color || '',
                    bg: companyRes.data.theme_bg_color || '',
                    text: companyRes.data.theme_text_color || ''
                });
                
                if (userRes.data.roles?.includes('superadmin')) {
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
    }, [token]);

    const isSuperAdmin = userRoles.includes('superadmin');

    const handleUpload = async (file) => {
        const fileToUpload = file || selectedFile;
        if (!fileToUpload) return;
        
        const form = new FormData();
        form.append('logo', fileToUpload);
        
        try {
            setUploadStatus('Synchronizing Identity...');
            await api.post('/uploads/company-logo', form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            setUploadStatus('New Organization Logo Engaged!');
            setSelectedFile(null);
            
            // Reload company data to get the new logo
            const res = await api.get('/company/me');
            setCompanyInfo(res.data);
            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err) {
            console.error(err);
            setUploadStatus('Upload request dropped.');
            setTimeout(() => setUploadStatus(''), 3000);
        }
    };

    const handleDetailsUpdate = async () => {
        try {
            setDetailsStatus('Updating...');
            await api.put('/company/me', details);
            setDetailsStatus('Company Directory Updated!');
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

    if (loading) return <PremiumLoader message="Fetching Organization Subsystems..." />;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="mx-auto w-full">
            {uploadStatus && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center shadow-sm ${uploadStatus.includes('failed') || uploadStatus.includes('dropped') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-[#e0e7ff] text-[#3730A3] border border-[#c7d2fe]'} z-50`}>
                    {uploadStatus}
                </div>
            )}

            <div className="bg-white rounded-[24px] shadow-[0_4px_34px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden relative">
                
                {/* Enterprise Header Area */}
                <div className="h-40 bg-gradient-to-r from-[var(--theme-primary,#3730A3)] to-indigo-800 relative overflow-hidden">
                    {!isSuperAdmin && (
                        <div className="absolute top-5 right-5 bg-yellow-500/80 backdrop-blur-md border border-yellow-400 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-md z-20">
                            <FiSettings className="mr-2"/> Protected View (Read Only)
                        </div>
                    )}
                    
                    {/* Background decorations */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dimension.png')] bg-repeat"></div>
                    <div className="absolute right-0 bottom-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                {/* Main Profile Body */}
                <div className="px-4 md:px-8 pb-10">
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-10 relative z-10 w-full">
                        
                        {/* Interactive Logo Column */}
                        <div className="lg:w-1/4 -mt-12 lg:-mt-20 flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[28px] md:rounded-[32px] bg-white p-2 shadow-xl mb-6 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="w-full h-full bg-gray-50 rounded-[24px] flex items-center justify-center text-[54px] text-[var(--theme-primary)] font-bold tracking-tighter border border-gray-100 overflow-hidden relative">
                                        {companyInfo?.logo_original_url ? (
                                            <img src={companyInfo.logo_original_url} alt="Enterprise Logo" className="w-full h-full object-contain p-2 bg-white"/>
                                        ) : (
                                            <>{companyInfo?.name?.[0] || 'O'}</>
                                        )}
                                        
                                        {isSuperAdmin && (
                                            <div 
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white flex-col cursor-pointer"
                                                onClick={() => document.getElementById('companyLogoUpload').click()}
                                            >
                                                <FiImage size={28} className="mb-2"/>
                                                <span className="text-[11px] uppercase font-bold tracking-widest text-center px-1">Update Insignia</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isSuperAdmin && (
                                    <input 
                                        type="file" 
                                        id="companyLogoUpload"
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={(e) => {
                                            if(e.target.files[0]) {
                                                handleUpload(e.target.files[0]);
                                            }
                                        }} 
                                    />
                                )}
                            </div>
                            
                            <div className="w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center">
                                    Network Active
                                </div>
                                <div className="w-full pt-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-center">Root Domain Space</p>
                                    <div className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-[13px] font-bold text-center truncate">
                                        {companyInfo?.domain || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Grid Column */}
                        <div className="lg:w-3/4 pt-6 lg:pt-2 w-full">
                            
                            {/* Summary Header */}
                            <div className="mb-6 md:mb-10 pb-6 border-b border-gray-100 text-center lg:text-left">
                                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none mb-3">
                                    {companyInfo?.name || 'Enterprise Matrix'}
                                </h1>
                                <p className="text-sm md:text-[18px] font-semibold text-[var(--theme-primary)] flex items-center justify-center lg:justify-start">
                                    Enterprise parameters and active framework identity
                                </p>
                            </div>

                            <div className="space-y-8">
                                
                                {/* Enterprise Directory Data */}
                                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-inner relative overflow-hidden">
                                    <h3 className="text-[16px] font-extrabold text-gray-800 mb-6 flex items-center border-b border-gray-200 pb-3 uppercase tracking-wider">
                                        <FiBriefcase className="mr-2 text-[var(--theme-primary)]"/> Global Directory Profile
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Registered Entity Name</label>
                                            {isSuperAdmin ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    value={details.name}
                                                    onChange={e => setDetails({...details, name: e.target.value})}
                                                />
                                            ) : (
                                                <div className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 text-[14px] shadow-sm">{companyInfo?.name || 'N/A'}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Primary Namespace Domain</label>
                                            {isSuperAdmin ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    value={details.domain}
                                                    onChange={e => setDetails({...details, domain: e.target.value})}
                                                />
                                            ) : (
                                                <div className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 text-[14px] shadow-sm">{companyInfo?.domain || 'N/A'}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Support Terminal (Phone)</label>
                                            {isSuperAdmin ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    value={details.phone}
                                                    onChange={e => setDetails({...details, phone: e.target.value})}
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            ) : (
                                                <div className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 text-[14px] shadow-sm">{companyInfo?.phone || 'N/A'}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Corporate Web Portal</label>
                                            {isSuperAdmin ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    value={details.website}
                                                    onChange={e => setDetails({...details, website: e.target.value})}
                                                    placeholder="https://www.example.com"
                                                />
                                            ) : (
                                                <div className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 text-[14px] shadow-sm">{companyInfo?.website || 'N/A'}</div>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Physical HQ Protocol (Address)</label>
                                            {isSuperAdmin ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    value={details.address}
                                                    onChange={e => setDetails({...details, address: e.target.value})}
                                                    placeholder="123 Enterprise Drive, Cloud City"
                                                />
                                            ) : (
                                                <div className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 text-[14px] shadow-sm">{companyInfo?.address || 'N/A'}</div>
                                            )}
                                        </div>
                                    </div>

                                    {isSuperAdmin && (
                                        <div className="mt-8 flex justify-end relative z-10 border-t border-gray-200 pt-5">
                                            {detailsStatus && (
                                                <p className={`text-sm font-bold absolute left-0 top-8 ${detailsStatus.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{detailsStatus}</p>
                                            )}
                                            <button 
                                                onClick={handleDetailsUpdate}
                                                disabled={detailsStatus === 'Updating...'}
                                                className="px-8 py-3.5 rounded-xl text-white font-extrabold transition-all shadow-[0_8px_30px_rgb(55,48,163,0.3)] hover:scale-105 active:scale-95 text-[14px]"
                                                style={{ backgroundColor: 'var(--theme-primary)' }}
                                            >
                                                Synchronize Directory
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Aesthetic Identity Configurator */}
                                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-inner overflow-hidden relative">
                                    <h3 className="text-[16px] font-extrabold text-gray-800 mb-6 flex items-center border-b border-gray-200 pb-3 uppercase tracking-wider">
                                        <FiAperture className="mr-2 text-[var(--theme-primary)]"/> Interface Token Design
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
                                        {[
                                            { label: 'Primary Core', key: 'primary', val: themeColors.primary },
                                            { label: 'Secondary Tone', key: 'secondary', val: themeColors.secondary },
                                            { label: 'Action Accent', key: 'accent', val: themeColors.accent },
                                            { label: 'Base Canvas', key: 'bg', val: themeColors.bg },
                                            { label: 'Typography', key: 'text', val: themeColors.text }
                                        ].map(item => (
                                            <div key={item.key} className="flex flex-col items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 text-center h-8 flex items-center">{item.label}</span>
                                                {isSuperAdmin ? (
                                                    <input 
                                                        type="color" 
                                                        value={item.val || '#ffffff'}
                                                        onChange={(e) => setThemeColors({...themeColors, [item.key]: e.target.value})}
                                                        className="w-12 h-12 rounded-[14px] cursor-pointer shadow-sm p-0 border-0 overflow-hidden mb-3"
                                                        style={{ WebkitAppearance: 'none' }}
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-[14px] shadow-sm mb-3 border border-gray-100" style={{ backgroundColor: item.val }}></div>
                                                )}
                                                <span className="font-mono text-[11px] text-gray-600 font-bold uppercase bg-gray-50 px-2 py-1 rounded w-full text-center truncate">{item.val || '#----'}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {isSuperAdmin && (
                                        <div className="mt-8 flex justify-end relative z-10 border-t border-gray-200 pt-5">
                                            {themeStatus && (
                                                <p className={`text-sm font-bold absolute left-0 top-8 ${themeStatus.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{themeStatus}</p>
                                            )}
                                            <button 
                                                onClick={() => setThemeColors({ primary: '#3730A3', secondary: '#d3d1ff', accent: '#818CF8', bg: '#F9FAFB', text: '#1F2937' })}
                                                className="px-6 py-3.5 rounded-xl text-gray-600 font-extrabold transition-all hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm text-[14px] mr-3"
                                            >
                                                Reset Defaults
                                            </button>
                                            <button 
                                                onClick={handleThemeUpdate}
                                                disabled={themeStatus === 'Updating...'}
                                                className="px-8 py-3.5 rounded-xl text-white font-extrabold transition-all shadow-[0_8px_30px_rgb(55,48,163,0.3)] hover:scale-105 active:scale-95 text-[14px]"
                                                style={{ backgroundColor: 'var(--theme-primary)' }}
                                            >
                                                Deploy Theme Topology
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* SMTP Networking Module */}
                                {isSuperAdmin && (
                                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-inner">
                                        <h3 className="text-[16px] font-extrabold text-gray-800 mb-6 flex items-center border-b border-gray-200 pb-3 uppercase tracking-wider">
                                            <FiMail className="mr-2 text-[var(--theme-primary)]"/> Encrypted Mail Node Setup
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">SMTP Relay Host</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    placeholder="smtp.example.com"
                                                    value={mailConfig.host}
                                                    onChange={e => setMailConfig({...mailConfig, host: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Node Port</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    placeholder="587"
                                                    value={mailConfig.port}
                                                    onChange={e => setMailConfig({...mailConfig, port: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Remote Access Key (User)</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    placeholder="proxy_user@domain"
                                                    value={mailConfig.user}
                                                    onChange={e => setMailConfig({...mailConfig, user: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Security Token (Pass)</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    placeholder="••••••••••"
                                                    value={mailConfig.pass}
                                                    onChange={e => setMailConfig({...mailConfig, pass: e.target.value})}
                                                />
                                            </div>
                                            <div className="md:col-span-2 mt-2">
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Alias Broadcaster Address</label>
                                                <input 
                                                    type="email" 
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
                                                    placeholder="operations@system.ai"
                                                    value={mailConfig.from}
                                                    onChange={e => setMailConfig({...mailConfig, from: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-end relative z-10 border-t border-gray-200 pt-5">
                                            {mailStatus && (
                                                <p className={`text-sm font-bold absolute left-0 top-8 ${mailStatus.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{mailStatus}</p>
                                            )}
                                            <button 
                                                onClick={handleMailUpdate}
                                                disabled={mailStatus === 'Updating...'}
                                                className="px-8 py-3.5 rounded-xl text-white font-extrabold disabled:opacity-50 transition-all shadow-[0_8px_30px_rgb(55,48,163,0.3)] hover:scale-105 active:scale-95 text-[14px]"
                                                style={{ backgroundColor: 'var(--theme-primary)' }}
                                            >
                                                Lock Gateway Settings
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrganizationProfile;
