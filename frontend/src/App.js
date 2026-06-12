import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, PublicOnly, OnboardingGuard } from './components/common/NavigationGuard';

// Components
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/admin/Dashboard';
import OnboardingGoogle from './components/onboarding/OnboardingGoogle';
import CompleteProfile from './components/CompleteProfile';
import SetPassword from './components/SetPassword';
import PremiumAlert from './components/PremiumAlert';
import PremiumConfirmation from './components/PremiumConfirmation';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { AlertProvider } from './context/AlertContext';

// Dashboard Sub-Modules
import EnterpriseOverview from './components/admin/EnterpriseOverview';
import EmployeeRegistry from './components/admin/EmployeeRegistry';
import OrganizationTree from './components/admin/OrganizationTree';
import OrganizationRegistry from './components/admin/OrganizationRegistry';
import OrganizationProfile from './components/admin/OrganizationProfile';
import UserProfile from './components/admin/UserProfile';
import UIBuilder from './components/admin/UIBuilder';
import CraftBuilder from './components/admin/CraftBuilder/CraftBuilder';
import ProjectAdmin from './components/enterprise/timesheets/ProjectAdmin';
import TimesheetModule from './components/enterprise/timesheets/TimesheetModule';
import DynamicPage from './components/DynamicPage';

function App() {
    return (
        <AlertProvider>
            <ConfirmationProvider>
                <PremiumAlert />
                <Router>
                    <AuthProvider>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/auth" element={<PublicOnly />}>
                                <Route path="login" element={<Login />} />
                                <Route path="register" element={<Register />} />
                            </Route>

                            {/* Unified invitation Flow */}
                            <Route path="/invite/accept" element={<SetPassword mode="invitation" />} />
                            <Route path="/accept-invitation" element={<SetPassword mode="invitation" />} />


                            {/* Setup/Onboarding Flow (Guarded) */}
                            <Route path="/setup" element={<OnboardingGuard />}>
                                <Route path="set-password" element={<SetPassword />} />
                                <Route path="set_password" element={<Navigate to="/setup/set-password" replace />} />
                                <Route path="onboarding" element={<OnboardingGoogle />} />
                                <Route path="profile" element={<CompleteProfile />} />
                            </Route>

                            {/* Main Dashboard (Guarded) */}
                            <Route path="/dashboard" element={<RequireAuth><OnboardingGuard><AdminDashboard /></OnboardingGuard></RequireAuth>}>
                                <Route index element={<EnterpriseOverview />} />
                                <Route path="employees" element={<EmployeeRegistry />} />
                                <Route path="org-structure" element={<OrganizationTree />} />
                                <Route path="org-registry" element={<OrganizationRegistry />} />
                                <Route path="company-profile" element={<OrganizationProfile />} />
                                <Route path="profile" element={<UserProfile />} />
                                <Route path="reports" element={<UIBuilder />} />
                                <Route path="craft" element={<CraftBuilder />} />
                                <Route path="projects" element={<ProjectAdmin />} />
                                <Route path="timesheets" element={<TimesheetModule />} />
                                <Route path="*" element={<DynamicPage />} />
                            </Route>

                            {/* Direct Employee Routes (Craft Pages outside /dashboard prefix) */}
                            <Route path="/employee" element={<RequireAuth><OnboardingGuard><AdminDashboard /></OnboardingGuard></RequireAuth>}>
                                <Route path="*" element={<DynamicPage />} />
                            </Route>

                            {/* Fallback Redirects */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </AuthProvider>
                </Router>
            </ConfirmationProvider>
        </AlertProvider>
    );
}

export default App;