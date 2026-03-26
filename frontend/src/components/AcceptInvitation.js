
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const AcceptInvitation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState({
        name: '',
        logo_medium_url: '',
        theme_primary_color: '#000000',
        theme_secondary_color: '#ffffff',
        theme_accent_color: '#6366f1', // Default accent
        theme_bg_color: '#f9fafb', // Default bg
        theme_text_color: '#1f2937' // Default text
    });

    useEffect(() => {
        if (!token) {
            setError('No invitation token found. Please use the link from your invitation.');
            return;
        }

        const fetchBranding = async () => {
            try {
                const response = await api.get(`/company/branding/${token}`);
                setTheme(response.data);
            } catch (err) {
                console.error("Failed to fetch company branding:", err);
                // Don't set a user-facing error for this, just use the default theme
            }
        };

        fetchBranding();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/accept-invitation', {
                token,
                password,
            });
            setSuccess(response.data.message + ' You will be redirected to login shortly.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Dynamic styles based on theme
    const dynamicStyles = {
        container: {
            backgroundColor: theme.theme_bg_color || '#f9fafb',
            color: theme.theme_text_color || '#1f2937'
        },
        button: {
            backgroundColor: theme.theme_primary_color || '#4f46e5',
        },
        focusRing: {
            '--tw-ring-color': theme.theme_primary_color || '#4f46e5'
        }
    };

    return (
        <div style={dynamicStyles.container} className="min-h-screen flex flex-col justify-center items-center">
            <div className="max-w-md w-full mx-auto text-center">
                {theme.logo_medium_url && (
                    <img src={theme.logo_medium_url} alt={`${theme.name} Logo`} className="mx-auto h-12 w-auto mb-4" />
                )}
                <h2 className="text-3xl font-bold">Set Your Password for {theme.name}</h2>
                <p className="mt-2 text-sm">
                    Complete your account setup by creating a secure password.
                </p>
            </div>
            <div className="max-w-md w-full mx-auto mt-8 bg-white p-8 border border-gray-200 rounded-xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" style={{color: dynamicStyles.container.color}} className="block text-sm font-medium">
                            New Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            style={dynamicStyles.focusRing}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={!token || isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" style={{color: dynamicStyles.container.color}} className="block text-sm font-medium">
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            required
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            style={dynamicStyles.focusRing}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={!token || isLoading}
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                    {success && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{success}</p>}

                    <div>
                        <button
                            type="submit"
                            style={dynamicStyles.button}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                            disabled={!token || isLoading}
                        >
                            {isLoading ? 'Activating Account...' : 'Set Password & Activate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AcceptInvitation;
