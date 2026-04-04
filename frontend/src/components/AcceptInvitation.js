import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { motion } from 'framer-motion';
import { FiLock, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';



const AcceptInvitation = () => {
    // Read token directly from URL — no React Router needed
    const token = new URLSearchParams(window.location.search).get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState({
        name: 'Your Organization',
        logo_medium_url: '',
        theme_primary_color: '#3730A3',
        theme_secondary_color: '#EEF2FF',
    });

    useEffect(() => {
        if (!token) return;
        const fetchBranding = async () => {
            try {
                const res = await api.get(`/company/branding/${token}`);
                setTheme(res.data);
            } catch {
                // silently use defaults
            }
        };
        fetchBranding();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) return setError('Passwords do not match.');
        if (password.length < 8) return setError('Password must be at least 8 characters long.');

        setIsLoading(true);
        try {
            await api.post('/auth/accept-invitation', { token, password });
            setSuccess(true);
            // After 3s redirect to root (login)
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const primary = theme.theme_primary_color || '#3730A3';
    const secondary = theme.theme_secondary_color || '#EEF2FF';

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <FiAlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-bold text-gray-800">Invalid Invitation Link</h2>
                    <p className="text-gray-500 mt-2">No token found. Please use the full link from your invitation email.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" style={{ background: `linear-gradient(145deg, #020617 0%, #1e1b4b 40%, #312E81 80%, ${primary} 100%)` }}>
            {/* Left — decorative panel */}
            <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute border border-white rounded-2xl"
                            style={{ width: `${80 + i * 60}px`, height: `${80 + i * 60}px`, top: `${10 + i * 10}%`, left: `${5 + i * 8}%`, transform: `rotate(${i * 12}deg)`, opacity: 0.4 - i * 0.05 }} />
                    ))}
                </div>
                <div className="relative z-10 text-center">
                    {theme.logo_medium_url && (
                        <img src={theme.logo_medium_url} alt={theme.name} className="h-14 mx-auto mb-8 object-contain" />
                    )}
                    <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
                        Welcome to<br />{theme.name}
                    </h1>
                    <p className="text-white/60 mt-4 text-base max-w-xs mx-auto leading-relaxed">
                        You've been invited to join the team. Set your password below to activate your account.
                    </p>
                </div>
            </div>

            {/* Right — form panel */}
            <div className="w-full lg:w-[480px] bg-white flex flex-col justify-center px-10 py-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                    {success ? (
                        <div className="text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ backgroundColor: secondary }}>
                                <FiCheckCircle size={40} style={{ color: primary }} />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-gray-800">Account Activated!</h2>
                            <p className="text-gray-500 mt-2 text-sm">Your account is ready. Redirecting you to login…</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                                    style={{ backgroundColor: secondary }}>
                                    <FiLock style={{ color: primary }} size={22} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Set Your Password</h2>
                                <p className="text-gray-500 text-sm mt-1">Create a secure password to activate your account at <strong>{theme.name}</strong>.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setError(''); }}
                                            placeholder="Minimum 8 characters"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all text-[14px] pr-12"
                                            style={{ '--tw-ring-color': primary }}
                                            onFocus={e => e.target.style.boxShadow = `0 0 0 3px ${primary}25`}
                                            onBlur={e => e.target.style.boxShadow = 'none'}
                                        />
                                        <button type="button" onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                                        placeholder="Re-enter your password"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all text-[14px]"
                                        onFocus={e => e.target.style.boxShadow = `0 0 0 3px ${primary}25`}
                                        onBlur={e => e.target.style.boxShadow = 'none'}
                                    />
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                                        <FiAlertCircle className="flex-shrink-0" size={16} />
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl text-white font-bold text-[14px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                    style={{ backgroundColor: primary, boxShadow: `0 4px 14px ${primary}40` }}
                                >
                                    {isLoading ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Activating Account…</>
                                    ) : 'Activate & Set Password'}
                                </button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AcceptInvitation;
