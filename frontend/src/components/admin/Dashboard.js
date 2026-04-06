import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBox, FiUsers, FiSettings, FiHome, FiBarChart2,
    FiBell, FiChevronDown, FiChevronRight, FiLogOut, FiInfo, FiGrid,
    FiMessageSquare, FiPieChart, FiMonitor, FiCheckCircle,
    FiArrowRight, FiArrowLeft, FiUser, FiPlus, FiX, FiCopy, FiCheck,
    FiClock, FiFileText, FiAward, FiMenu
} from 'react-icons/fi';
import PremiumLoader from '../PremiumLoader';
import { useAlert } from '../../context/AlertContext';
import UserProfile from './UserProfile';
import OrganizationProfile from './OrganizationProfile';
import UIBuilder from './UIBuilder';
import CraftBuilder from './CraftBuilder/CraftBuilder';
import SchemaEngine from '../DynamicUIRenderer/SchemaEngine';
import { FiLayout, FiZap } from 'react-icons/fi';

const StatCard = ({ icon, label, value, color }) => (
    <motion.div
        className="p-6 rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center space-x-4"
        style={{ borderLeft: `5px solid ${color}` }}
        whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0,0,0,0.06)' }}
    >
        <div className={`p-4 rounded-[14px]`} style={{ backgroundColor: `${color}20`, color: color }}>
            {React.createElement(icon, { size: 22 })}
        </div>
        <div>
            <p className="text-[13.5px] font-medium text-gray-500 mb-0.5">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-gray-800">{value}</p>
        </div>
    </motion.div>
);

const Dashboard = ({ token, logout }) => {
    const { showAlert } = useAlert();
    // --- Data State ---
    const [company, setCompany] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewAsEmployee, setViewAsEmployee] = useState(false);

    // --- UI State (Dribbble Layout) ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');

    // Localized Breadcrumb Helper
    const getBreadcrumbs = (tab) => {
        const homeTabs = ['Overview', 'Live Network', 'To-Dos'];
        const managementTabs = ['Insights', 'Data Lake', 'Collaboration', 'Employees', 'Reports'];
        const platformTabs = ['Demand', 'Module', 'UI CMS', 'Craft Builder'];
        const adminTabs = ['My Organization', 'My Profile'];

        if (homeTabs.includes(tab)) return ['Home', tab];
        if (managementTabs.includes(tab)) return ['Management', tab];
        if (platformTabs.includes(tab)) return ['Platform', tab];
        if (adminTabs.includes(tab)) return ['Admin', tab];
        return [tab];
    };

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // --- Admin Feature State ---
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [invitationLink, setInvitationLink] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        role: 'employee'
    });
    const [isInviting, setIsInviting] = useState(false);

    const [isMailConfigModalOpen, setIsMailConfigModalOpen] = useState(false);
    const [isSavingMailConfig, setIsSavingMailConfig] = useState(false);
    const [mailConfigData, setMailConfigData] = useState({
        smtp_host: '', smtp_port: '', smtp_username: '', smtp_password: '', smtp_from_email: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companyRes, userRes] = await Promise.all([
                    api.get('/company/me'),
                    api.get('/users/me')
                ]);

                setCompany(companyRes.data);
                setUser(userRes.data);

                const root = document.documentElement;
                root.style.setProperty('--theme-primary', companyRes.data.theme_primary_color || '#2bb6cb');
                root.style.setProperty('--theme-secondary', companyRes.data.theme_secondary_color || '#e4f5f8');
                root.style.setProperty('--theme-accent', companyRes.data.theme_accent_color || '#1e293b');
                root.style.setProperty('--theme-bg', companyRes.data.theme_bg_color || '#f0f4f8');
                root.style.setProperty('--theme-text', companyRes.data.theme_text_color || '#0f172a');
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const actualIsAdminOrSuper = user?.roles?.includes('superadmin') || user?.roles?.includes('admin');
    const isAdminOrSuper = actualIsAdminOrSuper && !viewAsEmployee;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(invitationLink);
        setIsCopied(true);
        showAlert("Secure link copied to clipboard!", "success");
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return <PremiumLoader message="Booting Workspace..." fullScreen />;
    }

    const NavItem = ({ icon, label, id, isSub = false }) => {
        const isActive = activeTab === id;

        return (
            <li className={`group ${isSub ? 'mt-1' : 'mt-2'}`}>
                <button
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'} 
                             rounded-lg transition-all duration-200 relative
                             ${isActive ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] font-semibold' : 'text-gray-600 hover:bg-gray-100 font-medium'}
                 `}
                >
                    {isActive && !isSidebarCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-[var(--theme-primary)] rounded-r-md"></div>
                    )}
                    <div className={`${isSidebarCollapsed ? 'text-xl' : 'text-lg'} ${isActive ? 'text-[var(--theme-primary)]' : 'text-gray-500 group-hover:text-gray-700'} transition-colors`}>
                        {icon}
                    </div>
                    {!isSidebarCollapsed && (
                        <span className={`ml-3 text-[14px] ${isSub ? 'text-[13.5px] font-medium transition-all' : 'tracking-tight'} truncate`}>{label}</span>
                    )}
                    {!isSidebarCollapsed && !isSub && (label === 'Home' || label === 'Insights' || label === 'Collaboration') && (
                        <FiChevronDown className="ml-auto opacity-50" size={14} />
                    )}
                </button>
            </li>
        );
    };

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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[40] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* SIDEBAR (Dribbble Layout) */}
            <aside className={`
                fixed lg:relative top-0 bottom-0 left-0 z-[50]
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
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                    <ul>
                        <NavItem icon={<FiHome />} label="Home" id="Home" />

                        {/* Sub-items block for Home */}
                        {!isSidebarCollapsed && (
                            <div className="ml-[22px] border-l border-gray-100 pl-2 mt-1 mb-3 space-y-0.5">
                                <NavItem isSub icon={<span className="w-[5px] h-[5px] rounded-full border border-gray-400"></span>} label="Overview" id="Overview" />
                                <NavItem isSub icon={<span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span>} label="Live Network" id="Live Network" />
                                <NavItem isSub icon={<span className="w-[5px] h-[5px] rounded-full border border-gray-400"></span>} label="To-Do's" id="To-Dos" />
                            </div>
                        )}

                        {isAdminOrSuper ? (
                            <>
                                <NavItem icon={<FiPieChart />} label="Insights" id="Insights" />
                                <NavItem icon={<FiGrid />} label="Data Lake" id="Data Lake" />
                                <NavItem icon={<FiMessageSquare />} label="Collaboration" id="Collaboration" />
                                <NavItem icon={<FiUsers />} label="Employees" id="Employees" />
                                <NavItem icon={<FiBarChart2 />} label="Reports" id="Reports" />

                                {!isSidebarCollapsed && (
                                    <div className="mt-8 mb-3 px-3">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Apps</span>
                                    </div>
                                )}

                                <NavItem icon={<FiMonitor />} label="Demand Planning" id="Demand" />
                                <NavItem icon={<FiBox />} label="Add Module" id="Module" />
                                <NavItem icon={<FiSettings />} label="UI Builder (CMS)" id="UI CMS" />
                                <NavItem icon={<FiZap />} label="Craft Builder (Pro)" id="Craft Builder" />
                            </>
                        ) : (
                            <>
                                <NavItem icon={<FiCheckCircle />} label="My Tasks" id="My Tasks" />
                                <NavItem icon={<FiMessageSquare />} label="Messages" id="Messages" />
                                <NavItem icon={<FiInfo />} label="Directory" id="Directory" />
                            </>
                        )}
                    </ul>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-50 space-y-0.5 pt-4">
                    <ul className="list-none m-0 p-0">
                        <NavItem icon={<FiSettings />} label="Settings" id="Settings" />
                        <NavItem icon={<FiInfo />} label="Info" id="Info" />
                    </ul>
                    <motion.button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className={`mt-4 w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-lg text-gray-500 hover:bg-gray-50 transition-colors group border border-dashed border-gray-200 hover:border-gray-300 shadow-sm`}
                    >
                        <motion.div
                            className="text-lg group-hover:text-[var(--theme-primary)] transition-colors"
                            animate={{ x: isSidebarCollapsed ? [0, 4, 0] : [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {isSidebarCollapsed ? <FiArrowRight /> : <FiArrowLeft />}
                        </motion.div>
                        {!isSidebarCollapsed && <span className="ml-3 text-[14px] font-bold group-hover:text-gray-700 transition-colors truncate">Collapse</span>}
                    </motion.button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden pt-6 px-4 md:px-8 pb-8">
                {/* TOP NAV (Enterprise Hierarchical Style) */}
                <header className="mb-8 px-0 md:px-2 flex flex-col border-b border-gray-50 pb-6">
                    {/* Level 1: Global Actions */}
                    <div className="flex justify-between items-center h-[40px]">
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 active:scale-95 transition-transform"
                            >
                                <FiMenu size={20} />
                            </button>
                        </div>

                        <div className="flex items-center space-x-1.5 bg-white px-1.5 py-1.5 rounded-full shadow-sm border border-gray-200/60 z-30 relative mr-1 md:mr-2">
                            {/* Notifications Cluster */}
                            <div className="relative border-r border-gray-100 pr-2 pl-1" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center cursor-pointer"
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
                                            className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100/80 z-50 overflow-hidden"
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
                                                <button className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Clear All Logs</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Profile */}
                            <div className="relative pl-1 pr-1" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
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
                                            className="absolute right-0 mt-4 w-52 bg-white rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 z-50 p-2"
                                        >
                                            <div className="p-1 space-y-0.5">
                                                <button onClick={() => { setActiveTab('My Organization'); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900 font-medium">
                                                    <FiBox className="mr-3 text-gray-400" size={16} /> My Organization
                                                </button>
                                                <button onClick={() => { setActiveTab('My Profile'); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900 font-medium">
                                                    <FiUser className="mr-3 text-gray-400" size={16} /> My Profile
                                                </button>
                                                <button onClick={() => setIsProfileOpen(false)} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900 font-medium">
                                                    <FiSettings className="mr-3 text-gray-400" size={16} /> Settings
                                                </button>

                                                <div className="border-t border-gray-100 my-1.5"></div>

                                                {viewAsEmployee ? (
                                                    <button onClick={() => { setViewAsEmployee(false); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                                                        <FiMonitor className="mr-3 opacity-60" size={16} /> View as Admin
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { setViewAsEmployee(true); setIsProfileOpen(false); }} className="w-full flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                                                        <FiUsers className="mr-3 opacity-60" size={16} /> View as Employee
                                                    </button>
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

                    {/* Level 2: Breadcrumb Hierarchy */}
                    <div className="mt-6 flex items-center text-[10px] md:text-[11px] font-black text-gray-400 tracking-[0.12em] px-1 group">
                        <div className="flex items-center bg-gray-50/50 px-2.5 py-1.5 rounded-lg border border-gray-100 group-hover:border-gray-200 transition-all">
                            <FiHome size={12} className="mr-2 opacity-50" />
                            {getBreadcrumbs(activeTab).map((crumb, idx, arr) => (
                                <React.Fragment key={idx}>
                                    <span className={idx === arr.length - 1 ? "text-[var(--theme-primary)] font-black" : ""}>
                                        {crumb}
                                    </span>
                                    {idx < arr.length - 1 && (
                                        <FiChevronRight className="mx-2.5 text-gray-400 opacity-50" size={12} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </header>

                {/* MAIN ADMIN CONTENT PANELS */}
                <main className="flex-1 overflow-y-auto scroll-smooth pl-4 pb-8">
                    {activeTab === 'My Profile' ? (
                        <UserProfile token={token} />
                    ) : activeTab === 'My Organization' ? (
                        <OrganizationProfile token={token} />
                    ) : activeTab === 'UI CMS' ? (
                        <UIBuilder token={token} />
                    ) : activeTab === 'Craft Builder' ? (
                        <CraftBuilder token={token} api={api} />
                    ) : isAdminOrSuper ? (
                        <>
                            {/* Admin Metrics Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard icon={FiUsers} label="Total Employees" value="1,254" color="var(--theme-primary)" />
                                <StatCard icon={FiBarChart2} label="Pending Approvals" value="12" color="var(--theme-accent)" />
                                <StatCard icon={FiHome} label="Active Departments" value="8" color="#10B981" />
                                <StatCard icon={FiSettings} label="Open Roles" value="4" color="#F59E0B" />
                            </div>

                            {/* Quick Actions preserving old Admin logic */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-5 tracking-tight text-gray-800">Operational Actions</h2>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => {
                                            if (!company?.smtp_host) {
                                                setIsMailConfigModalOpen(true);
                                            } else {
                                                setInvitationLink('');
                                                setIsInviteModalOpen(true);
                                            }
                                        }}
                                        className="flex items-center px-6 py-3.5 rounded-xl text-white font-medium transition-all shadow-[0_4px_14px_rgba(43,182,203,0.3)] hover:shadow-[0_6px_20px_rgba(43,182,203,0.4)] active:scale-95"
                                        style={{ backgroundColor: 'var(--theme-primary)' }}
                                    >
                                        <FiPlus className="mr-2" size={20} /> Invite New Employee
                                    </button>
                                    <button className="flex items-center px-6 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                                        <FiBarChart2 className="mr-2 text-gray-400" size={20} /> Build Analytical Report
                                    </button>
                                </div>
                            </div>

                            {/* Data Placeholder */}
                            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8 min-h-[300px] flex items-center justify-center border border-gray-100">
                                <p className="text-gray-400 italic font-medium">Analytical overview and employee directory infrastructure rendering here.</p>
                            </div>
                        </>
                    ) : (
                        <div className="w-full">
                            <SchemaEngine
                                route={(activeTab === 'Overview' || activeTab === 'Home') ? '/employee/dashboard' : activeTab}
                                dataSource="/api/v1/ui/context"
                                token={token}
                                onNavigate={(targetRoute) => setActiveTab(targetRoute)}
                            />
                        </div>
                    )}
                </main>
            </div>

            {/* Mail Configuration Intercept Modal */}
            <AnimatePresence>
                {isMailConfigModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMailConfigModalOpen(false)} className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg p-8 relative z-10 border border-gray-100"
                        >
                            <button onClick={() => setIsMailConfigModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2 focus:outline-none"><FiX size={20} /></button>
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
            </AnimatePresence>

            {/* User Invitation Modal (Maintained Backend Logic) */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsInviteModalOpen(false)}
                            className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[4px]"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-gray-100"
                        >
                            <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 focus:outline-none">
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
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Organizational Role</label>
                                        <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none appearance-none font-medium text-gray-700"
                                            onChange={e => setInviteData({ ...inviteData, role: e.target.value })}>
                                            <option value="employee">Standard Employee</option>
                                            <option value="admin">Administrator</option>
                                        </select>
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
                                    <button onClick={() => setIsInviteModalOpen(false)} className="w-full py-3.5 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors">Finalize Process</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
