import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import TimesheetConsole from './TimesheetConsole';
import ProjectAdmin from './ProjectAdmin';
import ApprovalDashboard from './ApprovalDashboard';
import TimesheetHistory from './TimesheetHistory';
import { FiClock, FiLayers, FiList, FiCheckSquare, FiActivity, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TimesheetModule = () => {
    const { user } = useAuth();
    const { isAdmin, setBreadcrumbContext } = useOutletContext();
    const [activeTab, setActiveTab] = useState('console');

    useEffect(() => {
        if (setBreadcrumbContext) {
            const labels = {
                'console': 'Console',
                'history': 'History',
                'approvals': 'Review'
            };
            setBreadcrumbContext(labels[activeTab] || null);
        }
    }, [activeTab, setBreadcrumbContext]);

    const isHrOrAdmin = isAdmin || user?.roles?.includes('hr');
    const isManager = !!user?.id;

    const [perfStats, setPerfStats] = useState({
        total_hours: 0,
        target_hours: 160,
        active_days: 0,
        efficiency_score: 0,
        efficiency_label: "0% Efficient",
        period: "Synchronizing..."
    });

    const fetchStats = async () => {
        try {
            const res = await api.get('/timesheets/stats');
            setPerfStats(res.data);
        } catch (err) {
            console.error("Failed to fetch performance telemetry:", err);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const getHeaderContent = () => {
        switch (activeTab) {
            case 'history':
                return {
                    title: "Historical Activity Audit",
                    sub: "Chronological Performance Registry & Archival Logs",
                    icon: <FiList size={22} />
                };
            case 'approvals':
                return {
                    title: "Master Authorization Queue",
                    sub: "Global Resource Synchronization & Validation Hub",
                    icon: <FiCheckSquare size={22} />
                };
            default:
                return {
                    title: "Timesheet Protocol Console",
                    sub: "Active Performance Monitoring & Resource Auditing",
                    icon: <FiActivity size={22} />
                };
        }
    };

    const header = getHeaderContent();

    return (
        <div className="nx-ts-container nx-ts-animate w-full space-y-8">
            {/* --- MATRIX COMMAND HEADER & NAVIGATION --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden"
            >
                {/* PRIMARY IDENTITY HEADER */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[var(--theme-primary)] text-white border-b border-white/5 relative overflow-hidden" style={{ boxShadow: 'var(--theme-primary-glow)' }}>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl shadow-black/10">
                            {header.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h1 className="text-xl font-black tracking-tight">{header.title}</h1>
                                <div className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase text-white/90 tracking-tighter">Strategic Console</span>
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">{header.sub}</p>
                        </div>
                    </div>

                    {/* GLASS DASHBOARD NAVIGATION */}
                    <nav className="relative z-10 flex items-center gap-1.5 p-1.5 bg-white/10 backdrop-blur-md rounded-[24px] border border-white/20 shadow-xl w-full xl:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
                        <TabButton
                            active={activeTab === 'console'}
                            onClick={() => setActiveTab('console')}
                            icon={<FiLayers size={16} />}
                            label="Sheets"
                            fullLabel="Submission"
                        />
                        <TabButton
                            active={activeTab === 'history'}
                            onClick={() => setActiveTab('history')}
                            icon={<FiSearch size={16} />}
                            label="History"
                            fullLabel="Audit"
                        />
                        {(isHrOrAdmin || isManager) && (
                            <TabButton
                                active={activeTab === 'approvals'}
                                onClick={() => setActiveTab('approvals')}
                                icon={<FiCheckSquare size={16} />}
                                label="Review"
                                fullLabel="Aprove TimeSheet"
                            />
                        )}
                    </nav>

                    {/* Background decorations */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                </div>

                {/* ENTERPRISE INTELLIGENCE STRIP (Mode Sensitive) */}
                <div className="bg-[var(--theme-secondary)]/10 px-6 py-4 sm:px-8 flex flex-wrap items-center gap-10 border-b border-slate-50 uppercase">
                    {activeTab === 'console' ? (
                        <>
                            <div className="flex items-center gap-3">
                                <FiClock className="text-[var(--theme-primary)]" size={16} />
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Total Effort</span>
                                    <span className="text-sm font-black text-slate-700">{perfStats?.total_hours || 0}h <span className="text-slate-300 font-bold">/ {perfStats?.target_hours || 160}h</span></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiActivity className="text-[var(--theme-primary)]" size={16} />
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Daily Utilization</span>
                                    <span className="text-sm font-black text-slate-700">{perfStats?.efficiency_label || '0% Meta'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiCheckSquare className="text-emerald-500" size={16} />
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Active Nodes</span>
                                    <span className="text-sm font-black text-slate-700">{perfStats?.active_days || 0} Working Days</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <FiActivity className="text-[var(--theme-accent)]" size={16} />
                            <div>
                                <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Registry Context</span>
                                <span className="text-sm font-black text-slate-700 tracking-tight">{perfStats?.period || "Synchronized Gateway Active"}</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* --- MAIN MODULE RENDER --- */}
            <main className="nx-ts-main">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {activeTab === 'console' && <TimesheetConsole user={user} isAdminMode={isAdmin} perfStats={perfStats} refreshStats={fetchStats} />}
                        {activeTab === 'history' && <TimesheetHistory user={user} perfStats={perfStats} />}
                        {activeTab === 'approvals' && <ApprovalDashboard user={user} api={api} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

// Sub-component for Premium Tab Interaction
const TabButton = ({ active, onClick, icon, label, fullLabel }) => (
    <button
        type="button"
        className={`relative group px-4 sm:px-6 py-3 rounded-[18px] text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 flex-1 xl:flex-none ${active ? 'text-white' : 'text-white/60 hover:text-white'}`}
        onClick={onClick}
    >
        {active && (
            <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-[18px] shadow-lg border border-white/20"
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            />
        )}
        <span className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-active:scale-95'}`}>
            {icon}
        </span>
        <span className="relative z-10 hidden sm:inline">{fullLabel}</span>
        <span className="relative z-10 sm:hidden">{label}</span>
    </button>
);

export default TimesheetModule;

