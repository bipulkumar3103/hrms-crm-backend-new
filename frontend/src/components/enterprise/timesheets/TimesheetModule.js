import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import TimesheetConsole from './TimesheetConsole';
import ProjectAdmin from './ProjectAdmin';
import ApprovalDashboard from './ApprovalDashboard';
import TimesheetHistory from './TimesheetHistory';
import { FiClock } from 'react-icons/fi';

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
            <header className="nx-ts-header">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-xl">
                        <FiClock className="nx-ts-text-primary" size={24} />
                    </div>
                    <div>
                        <h1 className="m-0 text-2xl font-black tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Enterprise Timesheet Pro</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 m-0">Organization Protocol Active</p>
                    </div>
                </div>
                <nav className="nx-ts-nav">
                    <button
                        type="button"
                        className={`nx-ts-nav-btn ${activeTab === 'console' ? 'active' : ''}`}
                        onClick={() => setActiveTab('console')}
                    >
                        My Sheets
                    </button>
                    <button
                        type="button"
                        className={`nx-ts-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        My History
                    </button>
                    {(isHrOrAdmin || isManager) && (
                        <button
                            type="button"
                            className={`nx-ts-nav-btn ${activeTab === 'approvals' ? 'active' : ''}`}
                            onClick={() => setActiveTab('approvals')}
                        >
                            Review Queue
                        </button>
                    )}
                </nav>
            </header>

            <main className="nx-ts-main">
                {activeTab === 'console' && <TimesheetConsole user={user} />}
                {activeTab === 'history' && <TimesheetHistory user={user} />}
                {activeTab === 'approvals' && <ApprovalDashboard user={user} api={customApi || api} />}
            </main>
        </div>
    );
};

export default TimesheetModule;
