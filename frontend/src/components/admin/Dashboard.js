import React, { useState, useEffect } from 'react';
import { FiHome, FiUsers, FiSettings, FiBarChart2, FiChevronLeft, FiChevronRight, FiBell, FiUser, FiPlus, FiX, FiCopy, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';

const StatCard = ({ icon, label, value, color }) => (
    <motion.div 
        className={`bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 border-l-4`}
        style={{ borderLeftColor: color }}
        whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
        transition={{ type: "spring", stiffness: 300 }}
    >
        <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
            {React.createElement(icon, { size: 24, style: { color } })}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)'}}>{value}</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const [company, setCompany] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeNav, setActiveNav] = useState('Dashboard');

    // Invitation State
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

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                const response = await api.get('/company/me');
                setCompany(response.data);
                
                const root = document.documentElement;
                root.style.setProperty('--theme-primary', response.data.theme_primary_color || '#4338ca');
                root.style.setProperty('--theme-secondary', response.data.theme_secondary_color || '#c7d2fe');
                root.style.setProperty('--theme-accent', response.data.theme_accent_color || '#db2777');
                root.style.setProperty('--theme-bg', response.data.theme_bg_color || '#f5f3ff');
                root.style.setProperty('--theme-text', response.data.theme_text_color || '#1f2937');

            } catch (error) {
                console.error("Failed to fetch company data", error);
            }
        };

        fetchCompanyData();
    }, []);

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            const response = await api.post('/users/invite', inviteData);
            setInvitationLink(response.data.invitation_link);
        } catch (error) {
            alert(error.response?.data?.error || "Failed to send invitation");
        } finally {
            setIsInviting(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(invitationLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const sidebarVariants = {
        expanded: { width: '280px' },
        collapsed: { width: '80px' }
    };
    
    const navItems = [
        {icon: FiHome, label: 'Dashboard'},
        {icon: FiUsers, label: 'Employees'},
        {icon: FiBarChart2, label: 'Reports'},
        {icon: FiSettings, label: 'Settings'}
    ];

    return (
        <div className="flex h-screen bg-gray-50" style={{ color: 'var(--theme-text)' }}>
            <motion.div 
                animate={isSidebarCollapsed ? "collapsed" : "expanded"}
                variants={sidebarVariants}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white shadow-xl flex flex-col justify-between relative z-20"
            >
                <div>
                    <div className="flex items-center px-4 h-20 border-b overflow-hidden">
                        <div className={`flex items-center space-x-3 w-full ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
                            {company?.logo_small_url && (
                                <img src={company.logo_small_url} alt={company.name} className="h-10 w-10 object-contain flex-shrink-0" />
                            )}
                            {!isSidebarCollapsed && (
                                <span className="text-xl font-bold truncate transition-opacity duration-300" style={{color: 'var(--theme-primary)'}}>
                                    {company?.name || "Dashboard"}
                                </span>
                            )}
                        </div>
                    </div>
                    <nav className="mt-6 px-4">
                        {navItems.map((item) => (
                             <a href="#" 
                                key={item.label} 
                                onClick={() => setActiveNav(item.label)}
                                className={`flex items-center px-4 py-3 my-2 rounded-lg transition-colors duration-200 
                                    ${activeNav === item.label 
                                        ? 'bg-[var(--theme-primary)] text-white shadow-md' 
                                        : 'text-gray-600 hover:bg-[var(--theme-secondary)]'}`}>
                                {React.createElement(item.icon, { size: 24, className:"flex-shrink-0" })}
                                <AnimatePresence>
                                {!isSidebarCollapsed && (
                                    <motion.span 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="ml-4 font-medium whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                                </AnimatePresence>
                            </a>
                        ))}
                    </nav>
                </div>
                 <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-4 top-1/2 bg-white border shadow-md p-2 rounded-full focus:outline-none z-30 transition-transform hover:scale-110">
                    {isSidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                </button>
            </motion.div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-6 h-20 bg-white border-b shadow-sm">
                    <h1 className="text-2xl font-bold" style={{color: 'var(--theme-text)'}}>Welcome Admin</h1>
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <FiBell size={24} className="text-gray-500 cursor-pointer hover:text-[var(--theme-primary)] transition-colors"/>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">3</span>
                        </div>
                        <div className="flex items-center space-x-3 cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-[var(--theme-secondary)] flex items-center justify-center transition-transform group-hover:scale-105">
                                <FiUser size={24} style={{color: 'var(--theme-primary)'}}/>
                            </div>
                            <span className="font-semibold hidden sm:block">Admin User</span>
                        </div>
                    </div>
                </header>
                
                <main className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--theme-bg)' }}>
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                     >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                            <StatCard icon={FiUsers} label="Total Employees" value="1,254" color="var(--theme-primary)" />
                            <StatCard icon={FiBarChart2} label="Pending Approvals" value="12" color="var(--theme-accent)" />
                            <StatCard icon={FiHome} label="Active Departments" value="8" color="#10B981" />
                            <StatCard icon={FiSettings} label="Open Roles" value="4" color="#F59E0B" />
                        </div>

                        {/* Quick Actions */}
                        <div className="mb-10">
                            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                            <div className="flex flex-wrap gap-4">
                                <button 
                                    onClick={() => { setInvitationLink(''); setIsInviteModalOpen(true); }}
                                    className="flex items-center px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg active:scale-95"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                >
                                    <FiPlus className="mr-2" size={20}/> Invite New User
                                </button>
                                <button className="flex items-center px-6 py-3 rounded-xl bg-white border border-gray-200 font-bold hover:bg-gray-50 transition-all shadow-sm">
                                    <FiBarChart2 className="mr-2" size={20}/> Generate Report
                                </button>
                            </div>
                        </div>

                        {/* Placeholder for Data Table / Charts */}
                        <div className="bg-white rounded-2xl shadow-md p-8 min-h-[300px] flex items-center justify-center border border-gray-100">
                            <p className="text-gray-400 italic">Analytical overview and employee directory coming soon...</p>
                        </div>
                     </motion.div>
                </main>
            </div>

            {/* User Invitation Modal */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsInviteModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10"
                        >
                            <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                                <FiX size={24}/>
                            </button>
                            
                            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--theme-primary)' }}>Invite Team Member</h2>

                            {!invitationLink ? (
                                <form onSubmit={handleInviteSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1">First Name</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] outline-none" 
                                                onChange={e => setInviteData({...inviteData, first_name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1">Last Name</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] outline-none" 
                                                onChange={e => setInviteData({...inviteData, last_name: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
                                        <input required type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] outline-none" 
                                            onChange={e => setInviteData({...inviteData, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
                                        <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] outline-none appearance-none bg-white"
                                            onChange={e => setInviteData({...inviteData, role: e.target.value})}>
                                            <option value="employee">Employee</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                    <button 
                                        disabled={isInviting}
                                        type="submit" 
                                        className="w-full py-3 rounded-lg text-white font-bold transition-all shadow-md mt-4 disabled:opacity-50"
                                        style={{ backgroundColor: 'var(--theme-primary)' }}
                                    >
                                        {isInviting ? "Generating Link..." : "Generate Invitation Link"}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-6 text-center">
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center">
                                        <FiCheck size={40} className="text-green-500 mb-2"/>
                                        <p className="text-green-800 font-medium">Link Generated Successfully!</p>
                                    </div>
                                    <div className="relative">
                                        <input readOnly value={invitationLink} className="w-full px-4 py-3 bg-gray-100 border rounded-lg text-sm font-mono pr-12" />
                                        <button onClick={copyToClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[var(--theme-primary)] transition-colors">
                                            {isCopied ? <FiCheck className="text-green-500"/> : <FiCopy/>}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 px-4 italic">Send this link to the user. They can use it to set their password and activate their account.</p>
                                    <button onClick={() => setIsInviteModalOpen(false)} className="w-full py-3 border rounded-lg font-bold hover:bg-gray-50 transition-colors">Close</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;