import React from 'react';
import { motion } from 'framer-motion';
import { 
    FiUsers, FiTrendingUp, FiActivity, FiGlobe, 
    FiPieChart, FiMonitor, FiCheckCircle,
    FiArrowRight, FiArrowLeft, FiUser, FiPlus, FiX, FiCopy, FiCheck,
    FiClock, FiFileText, FiAward, FiMail, FiLayers, FiMinus, FiArrowUpRight, FiArrowDownRight,
    FiCornerUpRight
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';

const MetricCard = ({ icon: Icon, label, value, trend, trendValue, color }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-gray-100/60 relative overflow-hidden group hover:shadow-[var(--theme-primary)]/10 transition-shadow duration-500"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-secondary)', color: color }}>
                <Icon size={20} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                    trend === 'up' ? 'text-green-600 bg-green-50' : 
                    trend === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50'
                }`}>
                    {trend === 'up' ? <FiArrowUpRight size={12}/> : 
                     trend === 'down' ? <FiArrowDownRight size={12}/> : <FiMinus size={12}/>}
                    {trendValue}
                </div>
            )}
        </div>
        <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{value}</h3>
        </div>
        
        {/* Decorative element */}
        <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Icon size={80} />
        </div>
    </motion.div>
);

const VisualAnalytics = () => {
    const bars = [40, 60, 45, 80, 55, 90, 75, 85, 65, 95, 80, 100];
    
    return (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100/60 shadow-[0_10px_40px_rgba(0,0,0,0.02)] h-full">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Personnel Growth Dynamics</h3>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Rolling 12-Month Projection</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="w-2 h-2 rounded-full bg-[var(--theme-primary)]"></div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Active</span>
                    </div>
                </div>
            </div>
            
            <div className="h-48 flex items-end justify-between gap-2 px-1">
                {bars.map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                        <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.05, duration: 1, ease: "easeOut" }}
                            className="w-full bg-[var(--theme-secondary)] group-hover:bg-[var(--theme-primary)] rounded-t-lg transition-colors relative"
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {height}% Cap
                            </div>
                        </motion.div>
                        <span className="text-[9px] font-bold text-gray-300 mt-3 group-hover:text-gray-500 uppercase tracking-tighter">M{i+1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DepartmentHealth = () => {
    const depts = [
        { name: 'Engineering Cluster', cap: 92, staff: 450, color: 'var(--theme-primary)' },
        { name: 'Product Logistics', cap: 78, staff: 120, color: 'var(--theme-accent)' },
        { name: 'Operations Node', cap: 85, staff: 320, color: 'var(--theme-primary)', opacity: 0.7 },
        { name: 'Human Capital', cap: 64, staff: 45, color: 'var(--theme-accent)', opacity: 0.7 },
    ];

    return (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100/60 shadow-[0_10px_40px_rgba(0,0,0,0.02)] h-full">
            <h3 className="text-[16px] font-bold text-gray-800 tracking-tight mb-8">Structural Resource Matrix</h3>
            
            <div className="space-y-6">
                {depts.map((dept, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-[12px] font-bold">
                            <span className="text-gray-700">{dept.name}</span>
                            <span className="text-gray-400 capitalize">{dept.staff} Identifier / {dept.cap}% Utilization</span>
                        </div>
                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${dept.cap}%` }}
                                transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: dept.color, opacity: dept.opacity || 1 }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            <button className="w-full mt-10 py-3 border border-dashed border-gray-200 rounded-xl text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-all">
                Access Full Structural Audit
            </button>
        </div>
    );
};

const MilestoneRegistry = () => (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100/60 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Active Operation Log</h3>
            <span className="px-3 py-1 bg-[var(--theme-secondary)] text-[var(--theme-primary)] text-[10px] font-bold rounded-full uppercase">Real-time</span>
        </div>
        
        <div className="space-y-5">
            {[
                { type: 'Identity', msg: 'New department cluster "AI Core" provisioned', time: '14 min ago', icon: FiLayers, color: 'text-[var(--theme-primary)]' },
                { type: 'Governance', msg: 'Updated security protocols for remote access', time: '2 hours ago', icon: FiCheckCircle, color: 'text-[var(--theme-accent)]' },
                { type: 'System', msg: 'Backup synchronization cycle completed', time: '5 hours ago', icon: FiActivity, color: 'text-[var(--theme-primary)]', opacity: 0.8 },
                { type: 'Event', msg: 'Quarterly Townhall deck distributed', time: '1 day ago', icon: FiGlobe, color: 'text-[var(--theme-accent)]', opacity: 0.8 },
            ].map((log, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                    <div className={`mt-1 p-2 rounded-lg bg-gray-50 ${log.color} group-hover:scale-110 transition-transform`}>
                        <log.icon size={14} />
                    </div>
                    <div className="border-b border-gray-50 pb-4 flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.type}</span>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">{log.time}</span>
                        </div>
                        <p className="text-[13px] font-semibold text-gray-700 leading-snug group-hover:text-[var(--theme-primary)] transition-colors">{log.msg}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const EnterpriseOverview = () => {
    const { user } = useAuth();
    const { isAdmin, onInvite } = useOutletContext();
    // Metric configuration based on role
    const adminMetrics = [
        { icon: FiUsers, label: "Total Workforce", value: "1,248", trend: "up", trendValue: "+8.4%", color: "var(--theme-primary)" },
        { icon: FiTrendingUp, label: "Operational Health", value: "98.2%", trend: "up", trendValue: "+1.2%", color: "var(--theme-primary)" },
        { icon: FiActivity, label: "Engagement Index", value: "84/100", trend: "up", trendValue: "+3.1%", color: "var(--theme-accent)" },
        { icon: FiGlobe, label: "Geo Latency", value: "24ms", trend: "down", trendValue: "-4ms", color: "var(--theme-accent)" }
    ];

    const employeeMetrics = [
        { icon: FiCheckCircle, label: "Available Leave", value: "14 Days", trend: "up", trendValue: "Renewed", color: "var(--theme-primary)" },
        { icon: FiClock, label: "Hours Tracked", value: "164.5h", trend: "up", trendValue: "This Month", color: "var(--theme-primary)" },
        { icon: FiLayers, label: "Active Projects", value: "3", trend: null, trendValue: null, color: "var(--theme-accent)" },
        { icon: FiMail, label: "Unread Intel", value: "2", trend: "down", trendValue: "-5", color: "var(--theme-accent)" }
    ];

    const metrics = isAdmin ? adminMetrics : employeeMetrics;

    return (
        <div className="space-y-8 pb-10">
            {/* Header Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">
                        {isAdmin ? 'Corporate Nexus Overview' : `Welcome Back, ${user?.first_name || 'Member'}`}
                    </h2>
                    <p className="text-[12px] font-bold text-[var(--theme-primary)] uppercase tracking-[0.3em]">
                        {isAdmin ? 'Operational Intelligence Framework v2.4' : 'Personal Member Terminal & Activity'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95">
                        <FiClock size={16}/> {isAdmin ? 'Historical View' : 'My History'}
                    </button>
                    {isAdmin ? (
                        <button 
                            onClick={onInvite}
                            className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-white shadow-lg flex items-center gap-2 hover:brightness-110 transition-all active:scale-95"
                            style={{ backgroundColor: 'var(--theme-primary)' }}
                        >
                            <FiPlus size={16}/> Invite Personnel
                        </button>
                    ) : (
                        <button 
                            className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-white shadow-lg flex items-center gap-2 hover:brightness-110 transition-all active:scale-95"
                            style={{ backgroundColor: 'var(--theme-primary)' }}
                        >
                            <FiPlus size={16}/> Action Request
                        </button>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <MetricCard key={i} {...m} />
                ))}
            </div>

            {/* Mid Section Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <VisualAnalytics />
                </div>
                <div className="lg:col-span-2">
                    <DepartmentHealth />
                </div>
            </div>

            {/* Bottom Section Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MilestoneRegistry />
                </div>
                <div className="bg-[var(--theme-primary)] p-10 rounded-[32px] shadow-[0_30px_70px_var(--theme-primary-rgb-low)] text-white relative overflow-hidden flex flex-col justify-between group">
                    <div className="relative z-10">
                        <FiTrendingUp size={40} className="mb-4 text-white/40" />
                        <h3 className="text-xl font-bold tracking-tight mb-2">
                            {isAdmin ? 'Performance Benchmark' : 'Team Contribution'}
                        </h3>
                        <p className="text-white/70 text-[13px] font-medium leading-relaxed">
                            {isAdmin 
                             ? 'Your organization is currently performing 14% higher than the industry baseline for Q2 2026.'
                             : 'You have contributed to 85% of your team milestones this sprint. Keep up the momentum.'}
                        </p>
                    </div>
                    
                    <div className="mt-8 relative z-10">
                        <div className="text-4xl font-black mb-4 tracking-tighter text-white/40 group-hover:text-white transition-colors cursor-pointer uppercase">
                            {isAdmin ? 'Elite Status' : 'Contributor'}
                        </div>
                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
                            {isAdmin ? 'View Deep Analytics' : 'Review My Stats'}
                        </button>
                    </div>

                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>
            </div>
        </div>
    );
};

export default EnterpriseOverview;
