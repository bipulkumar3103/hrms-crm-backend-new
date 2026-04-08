import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api'; // Adjusted import path for this directory level
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBox, FiUsers, FiSettings, FiHome, FiBarChart2, 
  FiBell, FiChevronDown, FiLogOut, FiInfo, FiGrid, 
  FiMessageSquare, FiPieChart, FiMonitor, FiCheckCircle,
  FiArrowRight, FiArrowLeft, FiUser, FiPlus, FiX, FiCopy, FiCheck,
  FiClock, FiFileText, FiAward
} from 'react-icons/fi';
import PremiumLoader from './PremiumLoader';
import { useAlert } from '../context/AlertContext';

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

const BrandedDashboard = () => {
    const { showAlert } = useAlert();
    // --- Data State ---
    const [company, setCompany] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewAsEmployee, setViewAsEmployee] = useState(false);

    // --- UI State (Dribbble Layout) ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // --- Feature State ---
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
                             ${isActive ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] font-semibold' : 'text-gray-600 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] font-medium'}
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
            
            {/* SIDEBAR (Dribbble Layout) */}
            <aside className={`${isSidebarCollapsed ? 'w-[84px]' : 'w-[260px]'} flex-shrink-0 bg-white m-4 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col z-20`}>
                {/* Logo Area */}
                <div className="h-24 flex items-center px-6">
                    <div className="flex items-center space-x-3 w-full">
                        {company?.logo_original_url ? (
                            <img src={company.logo_original_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-bold shadow-md">
                                {company?.name ? company.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                        )}
                        {!isSidebarCollapsed && (
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight truncate">
                                {company?.name || 'Company Name'}
                            </h1>
                        )}
                    </div>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                    <ul>
                        <NavItem icon={<FiHome/>} label="Home" id="Home" />
                        
                        {/* Sub-items block for Home */}
                        {!isSidebarCollapsed && (
                            <div className="ml-[22px] border-l border-gray-100 pl-2 mt-1 mb-3 space-y-0.5">
                                <NavItem isSub icon={<span className="w-[5px] h-[5px] rounded-full border border-gray-400"></span>} label="Overview" id="Overview" />
                                <NavItem isSub icon={<span className="w-[5px] h-[5px] rounded-full bg-[var(--theme-primary)]"></span>} label="Live Network" id="Live Network" />
                                <NavItem isSub icon={<span className="w-[5px] h-[5px] rounded-full border border-gray-400"></span>} label="To-Do's" id="To-Dos" />
                            </div>
                        )}

                        {isAdminOrSuper ? (
                            <>
                                <NavItem icon={<FiPieChart/>} label="Insights" id="Insights" />
                                <NavItem icon={<FiGrid/>} label="Data Lake" id="Data Lake" />
                                <NavItem icon={<FiMessageSquare/>} label="Collaboration" id="Collaboration" />
                                <NavItem icon={<FiUsers/>} label="Employees" id="Employees" />
                                <NavItem icon={<FiBarChart2/>} label="Reports" id="Reports" />
                                
                                {!isSidebarCollapsed && (
                                    <div className="mt-8 mb-3 px-3">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Apps</span>
                                    </div>
                                )}
                                
                                <NavItem icon={<FiMonitor/>} label="Demand Planning" id="Demand" />
                                <NavItem icon={<FiBox/>} label="Add Module" id="Module" />
                            </>
                        ) : (
                            <>
                                <NavItem icon={<FiCheckCircle/>} label="My Tasks" id="My Tasks" />
                                <NavItem icon={<FiMessageSquare/>} label="Messages" id="Messages" />
                                <NavItem icon={<FiInfo/>} label="Directory" id="Directory" />
                            </>
                        )}
                    </ul>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-50 space-y-0.5 pt-4">
                     <NavItem icon={<FiSettings/>} label="Settings" id="Settings" />
                     <NavItem icon={<FiInfo/>} label="Info" id="Info" />
                     <motion.button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className={`mt-4 w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-lg text-gray-500 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-colors group border border-dashed border-gray-200 hover:border-gray-300 shadow-sm`}
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
            <div className="flex-1 flex flex-col overflow-hidden pt-6 pr-8 pb-8 pl-[2px]">
                
                {/* TOP NAV (Pill Style) */}
                <header className="h-[52px] flex justify-between items-center mb-8 pl-4">
                    <div className="text-2xl font-bold tracking-tight text-gray-800">
                        {activeTab === 'Live Network' ? 'Live Network Overview' : activeTab}
                    </div>

                    <div className="flex items-center space-x-1 bg-white px-1.5 py-1.5 rounded-full shadow-sm border border-gray-200/60 z-30 relative">
                        {/* Notifications */}
                        <div className="relative border-r border-gray-100 pr-2 pl-1" ref={notifRef}>
                            <button 
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-600 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-full transition-colors flex items-center justify-center cursor-pointer"
                            >
                                <FiBell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 border-2 border-white rounded-full text-[8px] font-bold text-white flex items-center justify-center leading-none">3</span>
                            </button>
                            
                            {/* Notif Dropdown */}
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
                                            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                                            <button className="text-[12px] text-[var(--theme-primary)] font-semibold hover:underline flex items-center gap-1">
                                                <FiCheckCircle size={12}/> Mark all as read
                                            </button>
                                        </div>
                                        <div className="bg-[var(--theme-secondary)] p-4 border-l-[3px] border-[var(--theme-primary)]">
                                            <div className="flex space-x-3">
                                                <div className="mt-0.5 p-1.5 bg-white rounded-full shadow-sm"><FiUser className="text-gray-500" size={14}/></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 leading-snug">System update completed.</p>
                                                    <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Administration • 5m ago</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white border-t border-gray-50">
                                            <button className="w-full py-2 bg-[var(--theme-primary)] text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity">
                                                Show all
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile */}
                        <div className="relative pl-1 pr-1" ref={profileRef}>
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-colors cursor-pointer"
                            >
                                <div className="w-[30px] h-[30px] rounded-full bg-[var(--theme-secondary)] border border-white flex items-center justify-center">
                                    <FiUser size={16} className="text-[var(--theme-primary)]"/>
                                </div>
                                <span className="text-[13.5px] font-semibold text-gray-700 hidden md:block tracking-tight">{user?.first_name || 'Active User'}</span>
                                <FiChevronDown className="text-gray-400 ml-1" size={16} />
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
                                            <a href="#" className="flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-lg hover:text-gray-900 font-medium">
                                                <FiBox className="mr-3 text-gray-400" size={16}/> My Organization
                                            </a>
                                            <a href="#" className="flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-lg hover:text-gray-900 font-medium">
                                                <FiUsers className="mr-3 text-gray-400" size={16}/> My Profile
                                            </a>
                                            <a href="#" className="flex items-center px-3 py-2 text-[13.5px] text-gray-600 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-lg hover:text-gray-900 font-medium">
                                                <FiSettings className="mr-3 text-gray-400" size={16}/> Settings
                                            </a>
                                            {actualIsAdminOrSuper && (
                                                <a href="#" className="flex items-center px-3 py-2 text-[13.5px] text-[var(--theme-primary)] hover:bg-indigo-50 rounded-lg font-medium cursor-pointer" onClick={(e) => { e.preventDefault(); setViewAsEmployee(!viewAsEmployee); }}>
                                                    <FiMonitor className="mr-3 text-[var(--theme-primary)]" size={16}/> {viewAsEmployee ? 'Revert to Admin View' : 'Preview Employee View'}
                                                </a>
                                            )}
                                            <div className="border-t border-gray-100 my-1.5"></div>
                                            <a href="#" className="flex items-center px-3 py-2 text-[13.5px] text-red-600 hover:bg-red-50 rounded-lg font-medium cursor-pointer" onClick={() => localStorage.removeItem('token') || window.location.reload()}>
                                                <FiLogOut className="mr-3 text-red-400" size={16}/> Log Out
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT PANELS */}
                <main className="flex-1 overflow-y-auto scroll-smooth pl-4 pb-8">
                    
                    {/* Content conditioned by role */}
                    {isAdminOrSuper ? (
                        <>
                            {/* Admin Metrics Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard icon={FiUsers} label="Total Employees" value="1,254" color="var(--theme-primary)" />
                                <StatCard icon={FiBarChart2} label="Pending Approvals" value="12" color="var(--theme-accent)" />
                                <StatCard icon={FiHome} label="Active Departments" value="8" color="#10B981" />
                                <StatCard icon={FiSettings} label="Open Roles" value="4" color="#F59E0B" />
                            </div>

                            {/* Admin Quick Actions */}
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
                                        <FiPlus className="mr-2" size={20}/> Invite New Employee
                                    </button>
                                    <button className="flex items-center px-6 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-all shadow-sm active:scale-95">
                                        <FiBarChart2 className="mr-2 text-gray-400" size={20}/> Build Analytical Report
                                    </button>
                                </div>
                            </div>

                            {/* Data Placeholder */}
                            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8 min-h-[300px] flex items-center justify-center border border-gray-100">
                                <p className="text-gray-400 italic font-medium">Analytical overview and employee directory infrastructure rendering here.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Employee Metrics Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard icon={FiCheckCircle} label="Available Leave (Days)" value="14" color="var(--theme-primary)" />
                                <StatCard icon={FiBell} label="Next Holiday" value="May 25" color="var(--theme-accent)" />
                                <StatCard icon={FiBox} label="Pending Tasks" value="3" color="#10B981" />
                                <StatCard icon={FiMessageSquare} label="Unread Messages" value="2" color="#F59E0B" />
                            </div>

                            {/* Employee Quick Actions */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-5 tracking-tight text-gray-800">My Actions</h2>
                                <div className="flex flex-wrap gap-4">
                                    <button 
                                        className="flex items-center px-6 py-3.5 rounded-xl text-white font-medium transition-all shadow-[0_4px_14px_rgba(43,182,203,0.3)] hover:shadow-[0_6px_20px_rgba(43,182,203,0.4)] active:scale-95"
                                        style={{ backgroundColor: 'var(--theme-primary)' }}
                                    >
                                        <FiPlus className="mr-2" size={20}/> Request Time Off
                                    </button>
                                    <button className="flex items-center px-6 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-all shadow-sm active:scale-95">
                                        <FiMessageSquare className="mr-2 text-gray-400" size={20}/> Send Message
                                    </button>
                                </div>
                            </div>

                            {/* Detailed Employee Widgets */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Today's Schedule */}
                                <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center tracking-tight">
                                        <FiClock className="mr-2 text-[var(--theme-primary)]"/> Today's Schedule
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <div className="w-12 h-12 bg-[#e4f5f8] rounded-xl flex items-center justify-center text-[var(--theme-primary)] font-bold text-sm shrink-0 shadow-sm border border-[#2bb6cb]/20">9 AM</div>
                                            <div className="ml-4">
                                                <p className="font-semibold text-gray-800 text-[14px]">Morning Standup</p>
                                                <p className="text-gray-500 text-[12px] mt-0.5">Conference Room A</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold text-sm shrink-0 shadow-sm border border-amber-100">1 PM</div>
                                            <div className="ml-4">
                                                <p className="font-semibold text-gray-800 text-[14px]">Project Sync Review</p>
                                                <p className="text-gray-500 text-[12px] mt-0.5">Virtual Teams Meeting</p>
                                            </div>
                                        </div>
                                        <button className="w-full py-2.5 bg-gray-50 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] border border-gray-200 text-gray-700 font-semibold rounded-xl text-[13px] transition-colors mt-2 shadow-sm">View Full Calendar</button>
                                    </div>
                                </div>

                                {/* Recent Payslips & Docs */}
                                <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center tracking-tight">
                                        <FiFileText className="mr-2 text-[var(--theme-primary)]"/> Recent Documents
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { name: 'April 2026 Payslip', date: 'Apr 01', icon: FiAward, color: 'text-green-600', bg: 'bg-green-50' },
                                            { name: 'Q1 Performance Review', date: 'Mar 28', icon: FiFileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { name: 'Updated Health Benefits', date: 'Mar 15', icon: FiBox, color: 'text-purple-600', bg: 'bg-purple-50' }
                                        ].map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50/50 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                                                <div className="flex items-center">
                                                    <div className={`p-2 rounded-lg ${doc.bg} ${doc.color} mr-3 shadow-sm`}>
                                                        <doc.icon size={16}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-[13px]">{doc.name}</p>
                                                        <p className="text-gray-400 text-[11px] font-medium">{doc.date}</p>
                                                    </div>
                                                </div>
                                                <FiArrowRight className="text-gray-300" size={14}/>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Company Announcements */}
                                <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center tracking-tight">
                                        <FiInfo className="mr-2 text-[var(--theme-primary)]"/> Announcements
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="border-l-2 border-[var(--theme-primary)] pl-4 py-1 bg-gradient-to-r from-gray-50 to-transparent pr-2 rounded-r-xl">
                                            <p className="text-[10px] font-bold text-[var(--theme-primary)] uppercase tracking-wider mb-1">Company Wide</p>
                                            <p className="font-medium text-gray-800 text-[13.5px] leading-snug">Annual Company Retreat scheduled for August.</p>
                                        </div>
                                        <div className="border-l-2 border-amber-400 pl-4 py-1 bg-gradient-to-r from-amber-50/50 to-transparent pr-2 rounded-r-xl">
                                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Engineering Dept</p>
                                            <p className="font-medium text-gray-800 text-[13.5px] leading-snug">Server maintenance scheduled for this weekend.</p>
                                        </div>
                                        <div className="border-l-2 border-gray-300 pl-4 py-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">HR Update</p>
                                            <p className="font-medium text-gray-800 text-[13.5px] leading-snug">New standardized templates available.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
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
                            <button onClick={() => setIsMailConfigModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-full p-2 focus:outline-none"><FiX size={20}/></button>
                            <div className="mb-6">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
                                   <FiSettings className="text-[var(--theme-primary)]" size={24}/>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Mail Configuration Required</h2>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed">Before circumventing invitations, your organization's SMTP communication parameters must be securely established.</p>
                            </div>
                            <form onSubmit={handleMailConfigSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">SMTP Host Server</label>
                                    <input required type="text" placeholder="smtp.gmail.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]" 
                                        value={mailConfigData.smtp_host} onChange={e => setMailConfigData({...mailConfigData, smtp_host: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">SMTP Port</label>
                                        <input required type="number" placeholder="587" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]" 
                                            value={mailConfigData.smtp_port} onChange={e => setMailConfigData({...mailConfigData, smtp_port: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Sender Address</label>
                                        <input required type="email" placeholder="hr@company.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]" 
                                            value={mailConfigData.smtp_from_email} onChange={e => setMailConfigData({...mailConfigData, smtp_from_email: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Auth Username</label>
                                        <input required type="text" placeholder="Access ID" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]" 
                                            value={mailConfigData.smtp_username} onChange={e => setMailConfigData({...mailConfigData, smtp_username: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">App Password</label>
                                        <input required type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all text-[14px]" 
                                            value={mailConfigData.smtp_password} onChange={e => setMailConfigData({...mailConfigData, smtp_password: e.target.value})} />
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
                            <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-full p-1.5 focus:outline-none">
                                <FiX size={20}/>
                            </button>
                            
                            <h2 className="text-2xl font-bold mb-6 tracking-tight text-gray-800">Add Team Member</h2>

                            {!invitationLink ? (
                                <form onSubmit={handleInviteSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">First Name</label>
                                            <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all" 
                                                onChange={e => setInviteData({...inviteData, first_name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Last Name</label>
                                            <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all" 
                                                onChange={e => setInviteData({...inviteData, last_name: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email Address</label>
                                        <input required type="email" placeholder="colleague@domain.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all" 
                                            onChange={e => setInviteData({...inviteData, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Organizational Role</label>
                                        <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none appearance-none font-medium text-gray-700"
                                            onChange={e => setInviteData({...inviteData, role: e.target.value})}>
                                            <option value="employee">Standard Employee</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                    <button 
                                        disabled={isInviting}
                                        type="submit" 
                                        className="w-full py-3.5 rounded-xl text-white font-bold transition-all shadow-[0_4px_14px_rgba(43,182,203,0.3)] hover:shadow-[0_6px_20px_rgba(43,182,203,0.4)] mt-6 disabled:opacity-50"
                                        style={{ backgroundColor: 'var(--theme-primary)' }}
                                    >
                                        {isInviting ? "Authenticating Request..." : "Send Invitation Access"}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-6 text-center">
                                    <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center">
                                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                            <FiCheck size={28} className="text-green-600"/>
                                        </div>
                                        <p className="text-green-800 font-bold text-lg">Secure Link Formulated</p>
                                    </div>
                                    <div className="relative">
                                        <input readOnly value={invitationLink} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-600 font-mono pr-12 focus:outline-none" />
                                        <button onClick={copyToClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-[var(--theme-primary)] rounded-lg transition-colors">
                                            {isCopied ? <FiCheck className="text-green-500"/> : <FiCopy/>}
                                        </button>
                                    </div>
                                    <p className="text-[13px] text-gray-500 px-2">Distribute this secure access string to the recipient. They will use it to bypass standard registration and associate seamlessly with the organization profile.</p>
                                    <button onClick={() => setIsInviteModalOpen(false)} className="w-full py-3.5 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-colors">Finalize Process</button>
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

export default BrandedDashboard;
