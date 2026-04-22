import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBox, FiUsers, FiSettings, FiHome, FiBarChart2,
    FiBell, FiChevronDown, FiChevronRight, FiLogOut, FiInfo, FiGrid,
    FiMessageSquare, FiPieChart, FiMonitor, FiCheckCircle,
    FiArrowRight, FiArrowLeft, FiUser, FiPlus, FiX, FiCopy, FiCheck,
    FiClock, FiFileText, FiAward, FiMenu, FiLayout, FiZap, FiLayers, FiShield, FiBriefcase,
    FiTarget, FiLock, FiActivity, FiGlobe
} from 'react-icons/fi';
import PremiumLoader from '../PremiumLoader';
import { useAlert } from '../../context/AlertContext';
import EliteSelector from '../common/EliteSelector';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

/* ─── Sidebar Tree Configuration ─── */
const NAV_CONFIG = {
    'Home': {
        icon: FiHome,
        items: [
            { id: 'Overview', label: 'Overview', icon: FiActivity, path: '/dashboard' },
            { id: 'Live Network', label: 'Live Network', icon: FiGlobe, path: '/dashboard/org-structure' }
        ]
    },
    'Core Registry': {
        icon: FiLayers,
        items: [
            {
                id: 'Organizations',
                label: 'Organizations',
                icon: FiLayers,
                subItems: [
                    { id: 'Org Registry', label: 'Live Registry', icon: FiGrid, path: '/dashboard/org-registry', adminOnly: true },
                    { id: 'Org Profile', label: 'Brand Profile', icon: FiBox, path: '/dashboard/company-profile' },
                ]
            },
            {
                id: 'People',
                label: 'People',
                icon: FiUsers,
                subItems: [
                    { id: 'Employees', label: 'Directory', icon: FiUser, path: '/dashboard/employees', adminOnly: true },
                    { id: 'User Profile', label: 'My Identity', icon: FiUser, path: '/dashboard/profile' },
                ]
            }
        ]
    },
    'Enterprise Controls': {
        icon: FiShield,
        items: [
            {
                id: 'Attendance',
                label: 'Attendance',
                icon: FiClock,
                subItems: [
                    { id: 'Time Sheets', label: 'Time Sheets', icon: FiClock, path: '/dashboard/timesheets' },
                ]
            },
            {
                id: 'Projects',
                label: 'Projects',
                icon: FiBriefcase,
                adminOnly: true,
                subItems: [
                    { id: 'Project Registry', label: 'Registry', icon: FiBriefcase, path: '/dashboard/projects', adminOnly: true },
                ]
            },
            { id: 'Reports', label: 'Reports', icon: FiBarChart2, path: '/dashboard/reports', adminOnly: true },
            { id: 'Craft Builder', label: 'Craft Builder', icon: FiLayout, path: '/dashboard/craft', adminOnly: true }
        ]
    }
};

const resolveNavigationPath = (tabId) => {
    for (const [category, config] of Object.entries(NAV_CONFIG)) {
        for (const item of config.items) {
            if (item.id === tabId) return [category, item.label];
            if (item.subItems) {
                const subItem = item.subItems.find(si => si.id === tabId);
                if (subItem) return [category, item.label, subItem.label];
            }
        }
    }
    return [tabId];
};

/* ─── Generic Sidebar Item Component ─── */
const NavItem = ({ icon, label, id, path, subItems = [], isSub = false, isSidebarCollapsed, location, setIsMobileMenuOpen, isAdminOrSuper }) => {
    // Filter subItems based on permissions
    const visibleSubItems = subItems.filter(si => !si.adminOnly || isAdminOrSuper);
    const isActiveChild = visibleSubItems.some(si => si.path === location.pathname);
    const [isOpen, setIsOpen] = useState(isActiveChild);
    const hasSub = visibleSubItems.length > 0;

    // Sync open state when navigation happens externally
    useEffect(() => {
        if (isActiveChild) setIsOpen(true);
    }, [isActiveChild]);

    if (!isAdminOrSuper && !isSub && !hasSub && !path) return null; // Hide parents with no visible children

    return (
        <li className={`group ${isSub ? 'mt-1' : 'mt-2'}`}>
            {hasSub ? (
                <div className="flex flex-col">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} 
                                 rounded-xl transition-all duration-300 relative
                                 ${isActiveChild ? 'text-[var(--theme-primary)] bg-[var(--theme-secondary)] font-bold' : 'text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] font-semibold'}
                        `}
                    >
                        <div className={`${isSidebarCollapsed ? 'text-xl' : 'text-lg'} ${isActiveChild ? 'text-[var(--theme-primary)]' : 'text-gray-400 group-hover:text-[var(--theme-primary)]'} transition-colors flex items-center justify-center`}>
                            {icon}
                        </div>
                        {!isSidebarCollapsed && (
                            <>
                                <span className="ml-3.5 text-[14px] tracking-tight truncate">{label}</span>
                                <FiChevronDown
                                    className={`ml-auto transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-40`}
                                    size={14}
                                />
                            </>
                        )}
                    </button>

                    <AnimatePresence>
                        {isOpen && !isSidebarCollapsed && (
                            <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden ml-4 mt-1 space-y-1 border-l-2 border-gray-100/50 pl-2"
                            >
                                {visibleSubItems.map(si => (
                                    <NavItem
                                        key={si.id}
                                        id={si.id}
                                        label={si.label}
                                        icon={<si.icon size={13} />}
                                        path={si.path}
                                        isSub={true}
                                        isSidebarCollapsed={isSidebarCollapsed}
                                        location={location}
                                        setIsMobileMenuOpen={setIsMobileMenuOpen}
                                        isAdminOrSuper={isAdminOrSuper}
                                    />
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <NavLink
                    to={path}
                    end={path === '/dashboard'}
                    className={({ isActive }) => `
                        w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} 
                        rounded-xl transition-all duration-300 relative
                        ${isActive
                            ? 'text-white font-bold shadow-lg shadow-[var(--theme-primary)]/20'
                            : 'text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] font-semibold'}
                    `}
                    style={({ isActive }) => isActive ? { backgroundColor: 'var(--theme-primary)', color: 'white' } : {}}
                    onClick={() => {
                        if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && !isSidebarCollapsed && !isSub && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 bg-white/30 rounded-r-full shadow-sm"></div>
                            )}
                            <div className={`${isSidebarCollapsed ? 'text-xl' : 'text-lg'} ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[var(--theme-primary)]'} transition-colors flex items-center justify-center`}>
                                {icon}
                            </div>
                            {!isSidebarCollapsed && (
                                <span className={`ml-3.5 text-[14px] ${isSub ? 'text-[13.5px] font-semibold transition-all' : 'tracking-tight'} truncate`}>{label}</span>
                            )}
                        </>
                    )}
                </NavLink>
            )}
        </li>
    );
};

const Dashboard = () => {
    const { user: authUser, token, logout, refreshStatus } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert } = useAlert();
    // --- Data State ---
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewAsEmployee, setViewAsEmployee] = useState(false);

    // --- UI State (Dribbble Layout) ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    const [isHomeExpanded, setIsHomeExpanded] = useState(true);

    const [breadcrumbContext, setBreadcrumbContext] = useState(null);

    // Localized Breadcrumb Helper
    const getBreadcrumbs = (tab) => {
        const base = resolveNavigationPath(tab);
        if (breadcrumbContext) {
            return [...base, breadcrumbContext];
        }
        return base;
    };

    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const sidebarScrollRef = useRef(null);

    // Sidebar "Scan" animation on mount
    useEffect(() => {
        if (!isLoading && sidebarScrollRef.current) {
            const timer = setTimeout(() => {
                const el = sidebarScrollRef.current;
                el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });

                // Return to top after a short delay
                setTimeout(() => {
                    el.scrollTo({ top: 0, behavior: 'smooth' });
                }, 800);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // --- Admin Feature State ---
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [invitationLink, setInvitationLink] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        role: 'employee',
        department_id: '',
        designation_id: ''
    });
    const [isInviting, setIsInviting] = useState(false);

    // Organization Data for Selectors
    const [availableDepts, setAvailableDepts] = useState([]);

    const [isMailConfigModalOpen, setIsMailConfigModalOpen] = useState(false);
    const [isSavingMailConfig, setIsSavingMailConfig] = useState(false);
    const [mailConfigData, setMailConfigData] = useState({
        smtp_host: '', smtp_port: '', smtp_username: '', smtp_password: '', smtp_from_email: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const companyRes = await api.get('/company/me');
                setCompany(companyRes.data);

                // Populate mail config state with existing data
                if (companyRes.data) {
                    setMailConfigData({
                        smtp_host: companyRes.data.smtp_host || '',
                        smtp_port: companyRes.data.smtp_port || '',
                        smtp_username: companyRes.data.smtp_username || '',
                        smtp_password: companyRes.data.smtp_password || '',
                        smtp_from_email: companyRes.data.smtp_from_email || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // Clear sub-breadcrumb when changing top-level tabs
        setBreadcrumbContext(null);
    }, [activeTab]);

    const getTabIcon = (tabId) => {
        // First check categories
        if (NAV_CONFIG[tabId]) {
            return React.createElement(NAV_CONFIG[tabId].icon, { size: 12 });
        }
        // Then check items
        for (const category of Object.values(NAV_CONFIG)) {
            const item = category.items.find(i => i.id === tabId);
            if (item) return React.createElement(item.icon, { size: 12 });
        }
        return <FiHome size={12} />;
    };

    const user = authUser;
    const actualIsAdminOrSuper = React.useMemo(() =>
        user?.roles?.includes('superadmin') || user?.roles?.includes('admin'),
        [user?.roles]);

    const isAdminOrSuper = React.useMemo(() =>
        actualIsAdminOrSuper && !viewAsEmployee,
        [actualIsAdminOrSuper, viewAsEmployee]);

    const fetchOrgData = async () => {
        try {
            const res = await api.get('/organization/departments');
            setAvailableDepts(res.data);
        } catch (err) {
            console.error("Failed to fetch organization data", err);
        }
    };

    useEffect(() => {
        if (isAdminOrSuper) {
            fetchOrgData();
        }
    }, [isAdminOrSuper]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsMailConfigModalOpen(false);
                setIsInviteModalOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const handleMailConfigSubmit = async (e) => {
        e.preventDefault();
        setIsSavingMailConfig(true);
        try {
            await api.post('/company/mail-config', mailConfigData);
            setCompany({ ...company, smtp_host: mailConfigData.smtp_host });
            setIsMailConfigModalOpen(false);
            setInvitationLink('');
            setIsInviteModalOpen(true);
            showAlert("Mail server provisioned successfully.", "success");
        } catch (error) {
            showAlert(error.response?.data?.message || "Failed to provision mail server.", "error");
        } finally {
            setIsSavingMailConfig(false);
        }
    };

    const handleInvitePersonnelClick = () => {
        if (!company?.smtp_host) {
            setIsMailConfigModalOpen(true);
        } else {
            setIsInviteModalOpen(true);
        }
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            const response = await api.post('/users/invite', inviteData);
            setInvitationLink(response.data.invitation_link);
            if (response.data.email_sent) {
                showAlert(`Invitation sent! An email has been delivered to ${inviteData.email}.`, "success");
            } else {
                showAlert("Invitation link generated. Email not sent (mail not configured).", "info");
            }
        } catch (error) {
            showAlert(error.response?.data?.error || "Failed to send invitation", "error");
        } finally {
            setIsInviting(false);
        }
    };

    const closeInviteModal = () => {
        setIsInviteModalOpen(false);
        setInvitationLink('');
        setInviteData({
            email: '',
            first_name: '',
            last_name: '',
            role: 'employee',
            department_id: '',
            designation_id: ''
        });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(invitationLink);
        setIsCopied(true);
        showAlert("Secure link copied to clipboard!", "success");
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return <PremiumLoader message="Booting Workspace..." fullScreen />;
    }



    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>

            {/* MOBILE OVERLAY */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* SIDEBAR (Dribbble Layout) */}
            <aside className={`
                fixed lg:relative top-0 bottom-0 left-0 z-[1000]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isSidebarCollapsed ? 'w-[84px]' : 'w-[260px]'} 
                flex-shrink-0 bg-white m-0 lg:m-4 lg:rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] 
                transition-all duration-300 flex flex-col
            `}>
                {/* Logo Area */}
                <div className="h-24 flex items-center px-6">
                    <div className="flex items-center space-x-3 w-full">
                        {company?.logo_original_url ? (
                            <img src={company.logo_original_url} alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black text-xl shadow-lg transform rotate-3" style={{ backgroundColor: 'var(--theme-primary)' }}>
                                {company?.name ? company.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                        )}
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col">
                                <h1 className="text-[15px] font-black text-gray-800 tracking-tight leading-none">
                                    {company?.name || 'Enterprise'}
                                </h1>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--theme-primary)] mt-1 opacity-70">
                                    Management Alpha
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Sections */}
                <div
                    ref={sidebarScrollRef}
                    className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <ul className="space-y-1">
                        {Object.entries(NAV_CONFIG).map(([category, config]) => {
                            // Filter items based on admin status
                            const visibleItems = config.items.filter(item => !item.adminOnly || isAdminOrSuper);

                            // If the entire category is adminOnly, skip it if not admin
                            if (config.adminOnly && !isAdminOrSuper) return null;

                            // If no items are visible in this category, skip it
                            if (visibleItems.length === 0) return null;

                            return (
                                <React.Fragment key={category}>
                                    {!isSidebarCollapsed && (
                                        <div className="mt-6 mb-2 px-3">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{category}</span>
                                        </div>
                                    )}
                                    {visibleItems.map(item => (
                                        <NavItem
                                            key={item.id}
                                            icon={<item.icon />}
                                            label={item.label}
                                            id={item.id}
                                            path={item.path}
                                            subItems={item.subItems}
                                            isSidebarCollapsed={isSidebarCollapsed}
                                            location={location}
                                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                                            isAdminOrSuper={isAdminOrSuper}
                                        />
                                    ))}
                                </React.Fragment>
                            );
                        })}

                        {isAdminOrSuper && (
                            <>
                                {!isSidebarCollapsed && (
                                    <div className="mt-8 mb-3 px-3">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Personal Workspace</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => setViewAsEmployee(true)}
                                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} 
                                             rounded-xl transition-all duration-300 relative
                                             text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] font-semibold group`}
                                >
                                    <div className={`${isSidebarCollapsed ? 'text-xl' : 'text-lg'} text-gray-400 group-hover:text-[var(--theme-primary)] transition-colors flex items-center justify-center`}>
                                        <FiUser />
                                    </div>
                                    {!isSidebarCollapsed && (
                                        <span className="ml-3.5 text-[14px] tracking-tight truncate">My Self (Employee Mode)</span>
                                    )}
                                    <div className="ml-auto bg-[var(--theme-secondary)] px-2 py-0.5 rounded-md text-[9px] font-black text-[var(--theme-primary)] opacity-0 group-hover:opacity-100 transition-opacity">SWITCH</div>
                                </button>
                            </>
                        )}
                    </ul>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-50 space-y-0.5 pt-4">
                    <ul className="list-none m-0 p-0">
                        <NavItem
                            icon={<FiSettings />}
                            label="Settings"
                            id="Settings"
                            path="/dashboard/settings"
                            isSidebarCollapsed={isSidebarCollapsed}
                            location={location}
                            isAdminOrSuper={isAdminOrSuper}
                        />
                        <NavItem
                            icon={<FiInfo />}
                            label="Info"
                            id="Info"
                            path="/dashboard/info"
                            isSidebarCollapsed={isSidebarCollapsed}
                            location={location}
                            isAdminOrSuper={isAdminOrSuper}
                        />
                    </ul>
                    <motion.button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className={`mt-4 w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3.5'} rounded-xl text-gray-500 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] transition-all group border-2 border-dashed border-gray-100/80 hover:border-[var(--theme-primary)] shadow-sm`}
                    >
                        <motion.div
                            className="text-xl group-hover:text-[var(--theme-primary)] transition-colors"
                            animate={{ x: isSidebarCollapsed ? [0, 5, 0] : [0, -5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {isSidebarCollapsed ? <FiArrowRight /> : <FiArrowLeft />}
                        </motion.div>
                        {!isSidebarCollapsed && <span className="ml-3.5 text-[14px] font-bold tracking-tight transition-colors truncate">Collapse Protocol</span>}
                    </motion.button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden pt-6 px-4 md:px-8 pb-8">
                {/* TOP NAV (Enterprise Hierarchical Style) */}
                <header className="px-0 md:px-2 flex flex-col border-b border-gray-50 pb-3 relative z-[100]">
                    {/* Level 1: Global Actions */}
                    <div className="flex justify-between items-center h-[40px]">
                        <div className="flex items-center">
                            {!isMobileMenuOpen && (
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="lg:hidden p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 active:scale-95 transition-transform"
                                >
                                    <FiMenu size={20} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center space-x-1.5 bg-white px-1.5 py-1.5 rounded-full shadow-sm border border-gray-200/60 relative mr-1 md:mr-2">
                            {/* Notifications Cluster */}
                            <div className="relative border-r border-gray-100 pr-2 pl-1" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className="relative p-2 text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-full transition-colors flex items-center justify-center cursor-pointer"
                                >
                                    <FiBell size={20} />
                                    <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 border-2 border-white rounded-full text-[8px] font-bold text-white flex items-center justify-center leading-none">3</span>
                                </button>

                                <AnimatePresence>
                                    {isNotifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100/80 z-[9999] overflow-hidden"
                                        >
                                            <div className="p-4 flex justify-between items-center border-b border-gray-50">
                                                <h3 className="font-bold text-gray-800 text-sm md:text-base">Center Notifications</h3>
                                                <button className="text-[12px] text-[var(--theme-primary)] font-semibold hover:underline flex items-center gap-1">
                                                    <FiCheckCircle size={12} /> Mark read
                                                </button>
                                            </div>
                                            <div className="bg-[var(--theme-secondary)] p-4 border-l-[3px] border-[var(--theme-primary)]">
                                                <p className="text-sm font-bold text-gray-800">Admin Action Required</p>
                                                <p className="text-xs text-gray-500 mt-1">SMTP Server has been successfully provisioned.</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 text-center">
                                                <button className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Clear All Logs</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Profile */}
                            <div className="relative pl-1 pr-1" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] transition-colors cursor-pointer"
                                >
                                    <div className="w-[30px] h-[30px] rounded-full bg-[var(--theme-secondary)] border border-white flex items-center justify-center">
                                        <FiUser size={16} className="text-[var(--theme-primary)]" />
                                    </div>
                                    <span className="text-[13.5px] font-bold text-gray-700 hidden md:block tracking-tight">
                                        {user?.first_name || 'Admin User'}
                                    </span>
                                    <FiChevronDown className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} size={16} />
                                </button>

                                {/* Profile Dropdown */}
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute right-0 mt-4 w-52 bg-white rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 z-[9999] p-2"
                                        >
                                            <div className="p-1 space-y-0.5">
                                                <button onClick={() => { navigate('/dashboard/company-profile'); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-lg font-medium transition-all">
                                                    <FiBox className="mr-3 text-gray-400 group-hover:text-[var(--theme-primary)]" size={16} /> My Organization
                                                </button>
                                                <button onClick={() => { navigate('/dashboard/profile'); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-lg font-medium transition-all">
                                                    <FiUser className="mr-3 text-gray-400 group-hover:text-[var(--theme-primary)]" size={16} /> My Profile
                                                </button>
                                                <button onClick={() => { navigate('/dashboard/settings'); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-lg font-medium transition-all">
                                                    <FiSettings className="mr-3 text-gray-400 group-hover:text-[var(--theme-primary)]" size={16} /> Settings
                                                </button>

                                                {actualIsAdminOrSuper && (
                                                    <>
                                                        <div className="border-t border-gray-100 my-1.5"></div>
                                                        {viewAsEmployee ? (
                                                            <button onClick={() => { setViewAsEmployee(false); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-lg font-medium transition-all">
                                                                <FiMonitor className="mr-3 opacity-60" size={16} /> View as Admin
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => { setViewAsEmployee(true); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-lg font-medium transition-all">
                                                                <FiUsers className="mr-3 opacity-60" size={16} /> View as Employee
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                <div className="border-t border-gray-100 my-1.5"></div>

                                                <button onClick={logout} className="w-full flex items-center px-3 py-2 text-[13.5px] text-red-600 hover:bg-red-50 rounded-lg font-bold transition-all cursor-pointer">
                                                    <FiLogOut className="mr-3 text-red-400" size={16} /> Log Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                </header>

                {/* MAIN ADMIN CONTENT PANELS */}
                <main className="flex-1 overflow-y-auto scroll-smooth pl-4 pb-8 relative z-0">
                    <div className="mb-6 flex items-center text-[10px] md:text-[11px] font-semibold text-gray-400 tracking-widest px-1 group">
                        <div className="flex items-center bg-gray-50/50 px-2.5 py-1.5 rounded-lg border border-gray-100 group-hover:border-gray-200 transition-all">
                            <span className="text-[var(--theme-primary)] font-bold">
                                {location.pathname.split('/').filter(x => x).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' / ')}
                            </span>
                        </div>
                    </div>

                    <Outlet context={{
                        isAdmin: isAdminOrSuper,
                        user,
                        onInvite: handleInvitePersonnelClick,
                        setBreadcrumbContext
                    }} />
                </main>
            </div>

            {/* Mail Configuration Intercept Modal */}
            {createPortal(
                <AnimatePresence>
                    {isMailConfigModalOpen && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMailConfigModalOpen(false)} className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md" />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg p-8 relative z-10 border border-gray-100"
                            >
                                <button onClick={() => setIsMailConfigModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-full p-2 focus:outline-none"><FiX size={20} /></button>
                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border" style={{ backgroundColor: 'var(--theme-secondary)', borderColor: 'var(--theme-primary)', opacity: 0.8 }}>
                                        <FiSettings className="text-[var(--theme-primary)]" size={24} />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Mail Configuration Required</h2>
                                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">Before circumventing invitations, your organization's SMTP communication parameters must be securely established.</p>
                                </div>
                                <form onSubmit={handleMailConfigSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">SMTP Host Server</label>
                                        <input required type="text" placeholder="smtp.gmail.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]"
                                            value={mailConfigData.smtp_host} onChange={e => setMailConfigData({ ...mailConfigData, smtp_host: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">SMTP Port</label>
                                            <input required type="number" placeholder="587" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]"
                                                value={mailConfigData.smtp_port} onChange={e => setMailConfigData({ ...mailConfigData, smtp_port: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Sender Address</label>
                                            <input required type="email" placeholder="hr@company.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]"
                                                value={mailConfigData.smtp_from_email} onChange={e => setMailConfigData({ ...mailConfigData, smtp_from_email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Auth Username</label>
                                            <input required type="text" placeholder="Access ID" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]"
                                                value={mailConfigData.smtp_username} onChange={e => setMailConfigData({ ...mailConfigData, smtp_username: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">App Password</label>
                                            <input required type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]"
                                                value={mailConfigData.smtp_password} onChange={e => setMailConfigData({ ...mailConfigData, smtp_password: e.target.value })} />
                                        </div>
                                    </div>
                                    <button disabled={isSavingMailConfig} type="submit" className="w-full py-3.5 rounded-xl text-white font-bold transition-all shadow-[0_4px_14px_rgba(43,182,203,0.3)] hover:shadow-[0_6px_20px_rgba(43,182,203,0.4)] mt-6 disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--theme-primary)' }}>
                                        {isSavingMailConfig ? "Verifying Keys..." : "Provision Mail Server"}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* User Invitation Modal (Maintained Backend Logic) */}
            {createPortal(
                <AnimatePresence>
                    {isInviteModalOpen && (
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeInviteModal}
                                className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-gray-100"
                            >
                                <button onClick={closeInviteModal} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-full p-1.5 focus:outline-none">
                                    <FiX size={20} />
                                </button>

                                <h2 className="text-2xl font-bold mb-6 tracking-tight text-gray-800">Add Team Member</h2>

                                {!invitationLink ? (
                                    <form onSubmit={handleInviteSubmit} className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">First Name</label>
                                                <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all"
                                                    onChange={e => setInviteData({ ...inviteData, first_name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Last Name</label>
                                                <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all"
                                                    onChange={e => setInviteData({ ...inviteData, last_name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email Address</label>
                                            <input required type="email" placeholder="colleague@domain.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all"
                                                onChange={e => setInviteData({ ...inviteData, email: e.target.value })} />
                                        </div>
                                        <div className="mb-6">
                                            <EliteSelector
                                                label="Organizational Role"
                                                placeholder="Select Access Level"
                                                icon={FiShield}
                                                options={[
                                                    { id: 'employee', name: 'Standard Employee' },
                                                    ...(user?.roles?.includes('superadmin') ? [{ id: 'admin', name: 'Administrator' }] : [])
                                                ]}
                                                value={inviteData.role}
                                                onChange={val => setInviteData({ ...inviteData, role: val })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <EliteSelector
                                                label="Department"
                                                placeholder="Assign Later"
                                                icon={FiLayers}
                                                options={[
                                                    { id: '', name: 'Assign Later' },
                                                    ...availableDepts.map(d => ({ id: d.id, name: d.name }))
                                                ]}
                                                value={inviteData.department_id}
                                                onChange={val => setInviteData({ ...inviteData, department_id: val, designation_id: '' })}
                                            />
                                            <EliteSelector
                                                label="Designation"
                                                placeholder="Assign Later"
                                                icon={FiTarget}
                                                options={[
                                                    { id: '', name: 'Assign Later' },
                                                    ...(inviteData.department_id ? availableDepts.find(d => String(d.id) === String(inviteData.department_id))?.designations.map(des => ({ id: des.id, name: des.name })) : [])
                                                ]}
                                                value={inviteData.designation_id}
                                                onChange={val => setInviteData({ ...inviteData, designation_id: val })}
                                            />
                                        </div>
                                        <button
                                            disabled={isInviting}
                                            type="submit"
                                            className="w-full py-3.5 rounded-xl text-white font-bold transition-all mt-6 disabled:opacity-50"
                                            style={{ backgroundColor: 'var(--theme-primary)' }}
                                        >
                                            {isInviting ? "Authenticating Request..." : "Send Invitation Access"}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-6 text-center">
                                        <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center">
                                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                                <FiCheck size={28} className="text-green-600" />
                                            </div>
                                            <p className="text-green-800 font-bold text-lg">Secure Link Formulated</p>
                                        </div>
                                        <div className="relative">
                                            <input readOnly value={invitationLink} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-600 font-mono pr-12 focus:outline-none" />
                                            <button onClick={copyToClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-[var(--theme-primary)] rounded-lg transition-colors">
                                                {isCopied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                                            </button>
                                        </div>
                                        <p className="text-[13px] text-gray-500 px-2">Distribute this secure access string to the recipient. They will use it to bypass standard registration and associate seamlessly with the organization profile.</p>
                                        <button onClick={() => setIsInviteModalOpen(false)} className="w-full py-3.5 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-colors">Finalize Process</button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Global Styled Overrides */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
