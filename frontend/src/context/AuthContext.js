import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        const localToken = localStorage.getItem('token');
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        
        // Invitation flow detection: Don't claim token if we're on an invite route
        const isInvitationPath = window.location.pathname.includes('/invite') || 
                               window.location.pathname.includes('/accept-invitation');

        if (urlToken && !isInvitationPath) {
            localStorage.setItem('token', urlToken);
            return urlToken;
        }
        return localToken;
    });
    const [loading, setLoading] = useState(true);
    const [onboardingStatus, setOnboardingStatus] = useState({
        needs_password: false,
        has_company: false,
        profile_complete: false
    });

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setOnboardingStatus({
            needs_password: false,
            has_company: false,
            profile_complete: false
        });
    }, []);

    const fetchStatus = useCallback(async (currentToken) => {
        if (!currentToken) return;
        try {
            // Run onboarding check and user fetch in parallel for maximum speed
            const [statusRes, userRes] = await Promise.all([
                api.get('/onboarding/check-status'),
                api.get('/users/me')
            ]);
            
            setOnboardingStatus(prev => {
                if (JSON.stringify(prev) === JSON.stringify(statusRes.data)) return prev;
                return statusRes.data;
            });
            
            setUser(prevUser => {
                if (JSON.stringify(prevUser) === JSON.stringify(userRes.data)) return prevUser;
                return userRes.data;
            });

            // --- PROACTIVE THEME PROPAGATION ---
            // Fetch company theme immediately after status is verified
            if (statusRes.data.has_company) {
                try {
                    const companyRes = await api.get('/company/me');
                    const root = document.documentElement;
                    const c = companyRes.data;
                    if (c) {
                        root.style.setProperty('--theme-primary', c.theme_primary_color || '#3730A3');
                        root.style.setProperty('--theme-secondary', c.theme_secondary_color || '#e0e7ff');
                        root.style.setProperty('--theme-accent', c.theme_accent_color || '#1e293b');
                        root.style.setProperty('--theme-bg', c.theme_bg_color || '#f8fafc');
                        root.style.setProperty('--theme-text', c.theme_text_color || '#0f172a');
                    }
                } catch (tErr) {
                    console.warn("Global theme application deferred:", tErr);
                }
            }
        } catch (err) {
            console.error("Auth status sync failed:", err);
            if (err.response?.status === 401) {
                logout();
            }
        }
    }, [logout]); // Removed 'user' from dependencies to break the loop

    const login = useCallback((newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);

    const refreshStatus = useCallback(() => fetchStatus(token), [fetchStatus, token]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        const urlError = urlParams.get('error');

        // Invitation flow detection: Don't wipe the URL if we're on an invite route
        const isInvitationPath = window.location.pathname.includes('/invite') || 
                               window.location.pathname.includes('/accept-invitation');

        if ((urlToken && !isInvitationPath) || urlError) {
            // Only clean URL if it's a login token or an error. 
            // Invitation flows NEED the token in the URL for the child components.
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const hasInitialized = React.useRef(false);

    useEffect(() => {
        const initAuth = async () => {
            if (token && !hasInitialized.current) {
                setLoading(true);
                await fetchStatus(token);
                hasInitialized.current = true;
            }
            setLoading(false);
        };
        initAuth();
    }, [token, fetchStatus]);

    const value = React.useMemo(() => ({
        user,
        token,
        loading,
        onboardingStatus,
        login,
        logout,
        refreshStatus,
        isAuthenticated: !!token
    }), [user, token, loading, onboardingStatus, login, logout, refreshStatus]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
