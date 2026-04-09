import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import TimesheetConsole from './TimesheetConsole';
import ProjectAdmin from './ProjectAdmin';
import ApprovalDashboard from './ApprovalDashboard';
import TimesheetHistory from './TimesheetHistory';
import { FiClock, FiLayers, FiList, FiCheckSquare } from 'react-icons/fi';

const TimesheetModule = ({ user: initialUser, api: customApi }) => {
    const [user, setUser] = useState(initialUser || null);
    const [activeTab, setActiveTab] = useState('console');
    const [loading, setLoading] = useState(!initialUser);

    useEffect(() => {
        if (!initialUser) {
            api.get('/users/me')
                .then(res => {
                    setUser(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Auth failed", err);
                    setLoading(false);
                });
        }
    }, [initialUser]);

    if (loading) return <div className="nx-ts-msg sub">Initializing Enterprise Engine...</div>;
    if (!user) return <div className="nx-ts-msg err">Session expired. Please login.</div>;

    const isHrOrAdmin = user.roles?.includes('admin') || user.roles?.includes('superadmin') || user.roles?.includes('hr');
    const isManager = !!user.id;

    return (
        <div className="nx-ts-container nx-ts-animate">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center nx-ts-text-primary">
                        <FiClock size={20} className="sm:hidden" />
                        <FiClock size={24} className="hidden sm:block" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1">Enterprise Timesheet Pro</h1>
                        <p className="text-gray-400 font-semibold uppercase text-[8px] sm:text-[9px] tracking-[0.2em]">Organization Protocol Active</p>
                    </div>
                </div>
                <nav className="flex items-center gap-1 sm:gap-2 bg-white/50 p-1 rounded-2xl border border-gray-100 w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <button
                        type="button"
                        className={`px-3 sm:px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all hide-scrollbar flex items-center justify-center gap-2 flex-1 sm:flex-none ${activeTab === 'console' ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setActiveTab('console')}
                        title="My Sheets"
                    >
                        <FiLayers size={14} className={activeTab === 'console' ? 'text-white' : 'text-gray-300'} />
                        <span className="hidden xs:inline">My Sheets</span>
                        <span className="xs:hidden">Sheets</span>
                    </button>
                    <button
                        type="button"
                        className={`px-3 sm:px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all hide-scrollbar flex items-center justify-center gap-2 flex-1 sm:flex-none ${activeTab === 'history' ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setActiveTab('history')}
                        title="My History"
                    >
                        <FiList size={14} className={activeTab === 'history' ? 'text-white' : 'text-gray-300'} />
                        <span className="hidden xs:inline">My History</span>
                        <span className="xs:hidden">History</span>
                    </button>
                    {(isHrOrAdmin || isManager) && (
                        <button
                            type="button"
                            className={`px-3 sm:px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all hide-scrollbar flex items-center justify-center gap-2 flex-1 sm:flex-none ${activeTab === 'approvals' ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={() => setActiveTab('approvals')}
                            title="Review Queue"
                        >
                            <FiCheckSquare size={14} className={activeTab === 'approvals' ? 'text-white' : 'text-gray-300'} />
                            <span className="hidden xs:inline">Review Queue</span>
                            <span className="xs:hidden">Review</span>
                        </button>
                    )}
                </nav>
            </div>

            <main className="nx-ts-main">
                {activeTab === 'console' && <TimesheetConsole user={user} />}
                {activeTab === 'history' && <TimesheetHistory user={user} />}
                {activeTab === 'approvals' && <ApprovalDashboard user={user} api={customApi || api} />}
            </main>
        </div>
    );
};

export default TimesheetModule;
