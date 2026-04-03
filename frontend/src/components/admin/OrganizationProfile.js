import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
                    axios.get('/api/v1/company/me', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setCompanyInfo(companyRes.data);
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

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        const form = new FormData();
        form.append('logo', selectedFile);
        
        try {
            setUploadStatus('Uploading...');
            await axios.post('/api/v1/uploads/company-logo', form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setUploadStatus('Success!');
            setSelectedFile(null);
            
            // Reload company data to get the new logo
            const res = await axios.get('/api/v1/company/me', { headers: { Authorization: `Bearer ${token}` } });
            setCompanyInfo(res.data);
            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err) {
            console.error(err);
            setUploadStatus('Upload failed.');
        }
    };

    const handleThemeUpdate = async () => {
        try {
            setThemeStatus('Updating...');
            await axios.post('/api/v1/company/theme', {
                theme_primary_color: themeColors.primary,
                theme_secondary_color: themeColors.secondary,
                theme_accent_color: themeColors.accent,
                theme_bg_color: themeColors.bg,
                theme_text_color: themeColors.text
            }, { headers: { Authorization: `Bearer ${token}` } });
            setThemeStatus('Success!');
            setTimeout(() => setThemeStatus(''), 3000);
        } catch (err) {
            setThemeStatus('Update failed.');
        }
    };

    const handleMailUpdate = async () => {
        try {
            setMailStatus('Updating...');
            await axios.post('/api/v1/company/mail-config', {
                smtp_host: mailConfig.host,
                smtp_port: mailConfig.port,
                smtp_username: mailConfig.user,
                smtp_password: mailConfig.pass,
                smtp_from_email: mailConfig.from
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMailStatus('Success!');
            setTimeout(() => setMailStatus(''), 3000);
        } catch (err) {
            setMailStatus('Update failed.');
        }
    };

    if (loading) return <PremiumLoader message="Loading Organization..." />;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-5xl mx-auto py-8 pl-2 pr-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-800">My Organization</h2>
                    <p className="text-gray-500 mt-1">Enterprise parameters and branding.</p>
                </div>
                {!isSuperAdmin && (
                    <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-xl text-sm font-semibold border border-yellow-100 flex items-center">
                        <FiSettings className="mr-2"/> Read Only Mode
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Branding Card */}
                <div className="lg:col-span-2 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mr-4">
                            <FiImage className="text-[var(--theme-primary)]" size={20}/>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Visual Identity</h3>
                    </div>

                    <div className="flex items-center space-x-8 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-24 h-24 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {companyInfo?.logo_original_url ? (
                                <img src={companyInfo.logo_original_url} alt="Logo" className="max-w-full max-h-full object-contain p-2"/>
                            ) : (
                                <span className="text-gray-400 font-bold uppercase">{companyInfo?.name?.[0]}</span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-lg">{companyInfo?.name}</p>
                            <p className="text-gray-500 text-sm mt-1">{companyInfo?.domain}</p>
                        </div>
                    </div>

                    {isSuperAdmin && (
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700">Update Organization Logo</label>
                            <div className="flex items-center space-x-3">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => setSelectedFile(e.target.files[0])}
                                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-[var(--theme-primary)] hover:file:bg-indigo-100 file:font-semibold cursor-pointer transition-colors"
                                />
                                <button 
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploadStatus === 'Uploading...'}
                                    className="px-6 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 transition-all shadow-sm"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                >
                                    Upload
                                </button>
                            </div>
                            {uploadStatus && (
                                <p className={`text-sm font-medium ${uploadStatus.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>
                                    {uploadStatus}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Configuration Card */}
                <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-secondary)] flex items-center justify-center mb-6 border border-gray-50">
                        <FiAperture className="text-[var(--theme-primary)]" size={30}/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Theme Integration</h3>
                    <p className="text-gray-500 text-sm mb-8">Primary branding colors synchronizing with your dashboard.</p>
                    
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-600">Primary Color</span>
                            <div className="flex items-center">
                                {isSuperAdmin ? (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{themeColors.primary}</span>
                                        <input 
                                            type="color" 
                                            value={themeColors.primary}
                                            onChange={(e) => setThemeColors({...themeColors, primary: e.target.value})}
                                            className="w-8 h-8 rounded border-0 shadow-sm cursor-pointer"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{companyInfo?.theme_primary_color}</span>
                                        <div className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: companyInfo?.theme_primary_color }}></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-600">Secondary Color</span>
                            <div className="flex items-center">
                                {isSuperAdmin ? (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{themeColors.secondary}</span>
                                        <input 
                                            type="color" 
                                            value={themeColors.secondary}
                                            onChange={(e) => setThemeColors({...themeColors, secondary: e.target.value})}
                                            className="w-8 h-8 rounded border-0 shadow-sm cursor-pointer"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{companyInfo?.theme_secondary_color}</span>
                                        <div className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: companyInfo?.theme_secondary_color }}></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-600">Accent Color</span>
                            <div className="flex items-center">
                                {isSuperAdmin ? (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{themeColors.accent}</span>
                                        <input 
                                            type="color" 
                                            value={themeColors.accent}
                                            onChange={(e) => setThemeColors({...themeColors, accent: e.target.value})}
                                            className="w-8 h-8 rounded border-0 shadow-sm cursor-pointer"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{companyInfo?.theme_accent_color}</span>
                                        <div className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: companyInfo?.theme_accent_color }}></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-600">Background Color</span>
                            <div className="flex items-center">
                                {isSuperAdmin ? (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{themeColors.bg}</span>
                                        <input 
                                            type="color" 
                                            value={themeColors.bg}
                                            onChange={(e) => setThemeColors({...themeColors, bg: e.target.value})}
                                            className="w-8 h-8 rounded border-0 shadow-sm cursor-pointer"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{companyInfo?.theme_bg_color}</span>
                                        <div className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: companyInfo?.theme_bg_color }}></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-600">Text Color</span>
                            <div className="flex items-center">
                                {isSuperAdmin ? (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{themeColors.text}</span>
                                        <input 
                                            type="color" 
                                            value={themeColors.text}
                                            onChange={(e) => setThemeColors({...themeColors, text: e.target.value})}
                                            className="w-8 h-8 rounded border-0 shadow-sm cursor-pointer"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="font-mono text-xs text-gray-400 mr-2">{companyInfo?.theme_text_color}</span>
                                        <div className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: companyInfo?.theme_text_color }}></div>
                                    </>
                                )}
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <button 
                                    onClick={handleThemeUpdate}
                                    disabled={themeStatus === 'Updating...'}
                                    className="w-full px-6 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 transition-all shadow-sm"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                >
                                    Update Theme
                                </button>
                                {themeStatus && (
                                    <p className={`text-sm font-medium mt-2 ${themeStatus.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>
                                        {themeStatus}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mail Configuration Card (Superadmin only) */}
                {isSuperAdmin && (
                    <div className="lg:col-span-3 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 mt-4">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mr-4">
                                <FiMail className="text-[var(--theme-primary)]" size={20}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Mail Setup</h3>
                                <p className="text-gray-500 text-sm mt-1">Configure SMTP settings for outgoing system emails.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-opacity-20 outline-none transition-all placeholder:text-gray-400 bg-white"
                                    placeholder="smtp.example.com"
                                    value={mailConfig.host}
                                    onChange={e => setMailConfig({...mailConfig, host: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                                <input 
                                    type="number" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-opacity-20 outline-none transition-all placeholder:text-gray-400 bg-white"
                                    placeholder="587"
                                    value={mailConfig.port}
                                    onChange={e => setMailConfig({...mailConfig, port: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Username</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-opacity-20 outline-none transition-all placeholder:text-gray-400 bg-white"
                                    placeholder="user@example.com"
                                    value={mailConfig.user}
                                    onChange={e => setMailConfig({...mailConfig, user: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Password</label>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-opacity-20 outline-none transition-all placeholder:text-gray-400 bg-white"
                                    placeholder="Leave blank to keep existing password"
                                    value={mailConfig.pass}
                                    onChange={e => setMailConfig({...mailConfig, pass: e.target.value})}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">From Email</label>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-opacity-20 outline-none transition-all placeholder:text-gray-400 bg-white"
                                    placeholder="noreply@example.com"
                                    value={mailConfig.from}
                                    onChange={e => setMailConfig({...mailConfig, from: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleMailUpdate}
                                disabled={mailStatus === 'Updating...'}
                                className="px-8 py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-all shadow-sm flex items-center"
                                style={{ backgroundColor: 'var(--theme-primary)' }}
                            >
                                <FiSettings className="mr-2"/> Save Mail Configuration
                            </button>
                        </div>
                        {mailStatus && (
                            <p className={`text-sm font-medium mt-3 text-right ${mailStatus.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>
                                {mailStatus}
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default OrganizationProfile;
