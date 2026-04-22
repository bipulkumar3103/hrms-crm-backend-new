import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PremiumLoader from '../PremiumLoader';

/**
 * Ensures user is logged in. Redirects to /auth/login if not.
 */
export const RequireAuth = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <PremiumLoader message="Authenticating..." fullScreen />;

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    return children ? children : <Outlet />;
};

/**
 * Ensures user is NOT logged in. Redirects to /dashboard if they are.
 */
export const PublicOnly = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <PremiumLoader message="Syncing session..." fullScreen />;

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children ? children : <Outlet />;
};

/**
 * Handles the cascading onboarding stages. 
 * Redirects to the appropriate stage if benchmarks aren't met.
 */
export const OnboardingGuard = ({ children }) => {
    const { onboardingStatus, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) return <PremiumLoader message="Verifying status..." fullScreen />;

    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

    const { needs_password, has_company, profile_complete, roles } = onboardingStatus;
    const isSuperAdmin = roles?.includes('superadmin');

    // 1. Priority One: Set Password (Mandatory security step)
    if (needs_password) {
        if (location.pathname !== '/setup/set-password') {
            return <Navigate to="/setup/set-password" replace />;
        }
    } 
    // 2. Priority Two: Create Workspace (Only for Superadmins with no company record)
    else if (isSuperAdmin && !has_company) {
        if (location.pathname !== '/setup/onboarding') {
            return <Navigate to="/setup/onboarding" replace />;
        }
    }
    // 3. Priority Three: Complete Brand Profile (Only for Superadmins with incomplete company record)
    else if (isSuperAdmin && has_company && !profile_complete) {
        if (location.pathname !== '/setup/profile') {
            return <Navigate to="/setup/profile" replace />;
        }
    }

    // 3. Fallback: If on an onboarding page but benchmarks are passed (or bypass is allowed), send to dashboard
    const onboardingPaths = ['/setup/set-password', '/setup/onboarding', '/setup/profile'];
    if (onboardingPaths.includes(location.pathname)) {
        // If password is set AND (it's not a superadmin OR their company profile is fully synchronized), land on dashboard
        if (!needs_password && (!isSuperAdmin || (has_company && profile_complete))) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children ? children : <Outlet />;
};
