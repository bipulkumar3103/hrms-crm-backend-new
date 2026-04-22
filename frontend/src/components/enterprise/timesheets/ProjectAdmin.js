import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../../utils/api';
import { FiPlus, FiUserPlus, FiLayers, FiInfo, FiList, FiSearch, FiChevronDown, FiHash, FiUser, FiArrowRight, FiX, FiActivity, FiBriefcase } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import EliteSelector from '../../common/EliteSelector';
import { useAlert } from '../../../context/AlertContext';
import { useAuth } from '../../../context/AuthContext';
import PremiumLoader from '../../PremiumLoader';

const ProjectAdmin = () => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Form States
    const [newProject, setNewProject] = useState({ name: '', code: '', description: '' });
    const [assignment, setAssignment] = useState({ employee_id: '', project_id: '' });

    const [isCreating, setIsCreating] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        loadData();

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsCreateModalOpen(false);
                setIsAssignModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const loadData = async () => {
        try {
            const [pRes, eRes] = await Promise.all([
                api.get('/timesheets/projects'),
                api.get('/timesheets/employees-list')
            ]);
            setProjects(pRes.data);
            setEmployees(eRes.data);
        } catch (err) {
            console.error("Data load failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await api.post('/timesheets/projects', newProject);
            showAlert('Success: Identity registry entry created.', 'success');
            setNewProject({ name: '', code: '', description: '' });
            setIsCreateModalOpen(false);
            loadData();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Synchronization failure during provisioning', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setIsAssigning(true);
        try {
            await api.post('/timesheets/assign-project', assignment);
            showAlert('Success: Personnel mapping verified.', 'success');
            setAssignment({ employee_id: '', project_id: '' });
            setIsAssignModalOpen(false);
        } catch (err) {
            showAlert(err.response?.data?.message || 'Protocol failure during assignment', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleToggleStatus = async (projectId) => {
        setIsToggling(true);
        try {
            const res = await api.post(`/timesheets/projects/${projectId}/toggle`);
            setProjects(projects.map(p => p.id === projectId ? { ...p, is_active: res.data.is_active } : p));
        } catch (err) {
            console.error("Toggle failed", err);
        } finally {
            setIsToggling(false);
        }
    };

    if (isLoading) return <PremiumLoader message="Syncing Identity Registry..." />;

    return (
        <div className="nx-ts-animate w-full flex flex-col gap-6 pb-12">

            {/* --- ELITE COMMAND CENTER HEADER --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-3xl border border-gray-100 shadow-[0_20px_50px_var(--theme-primary-rgb-low)]"
            >
                {/* Header Strip */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[var(--theme-primary)] text-white rounded-t-3xl border-b border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black tracking-tight">
                                Project Master Registry
                            </h1>
                            <div className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase text-white/90 tracking-tighter">Governance Node</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                            Resource Provisioning & Policy Enforcement
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
                        >
                            <FiUserPlus size={14} /> Assign Project
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
                        >
                            <FiPlus size={14} /> Add Project
                        </button>
                    </div>
                </div>

                {/* Sub Metadata Strip */}
                <div className="bg-gray-50/30 px-6 py-4 sm:px-8 flex items-center gap-10 border-b border-gray-50 uppercase">
                    <div className="flex items-center gap-3">
                        <FiLayers className="text-[var(--theme-primary)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-gray-400 tracking-widest block leading-none mb-1">Active Modules</span>
                            <span className="text-sm font-black text-gray-700">{projects.length} Registered</span>
                        </div>
                    </div>
                </div>

                {/* Grid Registry Body */}
                <div className="p-6 sm:p-8">
                    {projects.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <FiBriefcase size={32} className="text-gray-200" />
                            </div>
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">No Active Identifiers</h3>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">Establish your first protocol module to begin resource mapping.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {projects.map((p) => (
                                <motion.div
                                    key={p.id}
                                    layout
                                    className={`bg-white rounded-[28px] border border-gray-100 transition-all group flex flex-col overflow-hidden ${p.is_active ? 'shadow-sm hover:shadow-xl hover:shadow-[var(--theme-primary)]/10' : 'opacity-70 grayscale bg-gray-50/50'}`}
                                >
                                    <div className="p-6 sm:p-7 flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${p.is_active ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] group-hover:bg-[var(--theme-primary)] group-hover:text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                <FiHash size={22} />
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${p.is_active ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] border-[var(--theme-primary)]/20' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                {p.code}
                                            </div>
                                        </div>

                                        <h3 className="text-[16px] font-black text-gray-800 tracking-tight mb-1 line-clamp-1" title={p.name}>{p.name}</h3>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed opacity-70">
                                            {p.is_active ? 'Active Protocol' : 'Decommissioned'}
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
                                                <span>Resource Analytics</span>
                                                <FiActivity size={10} className="opacity-40" />
                                            </div>
                                            <div className="flex items-center justify-between bg-gray-50/50 py-3 px-4 rounded-xl border border-gray-100/50">
                                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Total Sourced</span>
                                                <span className="text-[14px] font-black text-[var(--theme-primary)] leading-none">{p.total_hours}h</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Anchor */}
                                    <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between group/action">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Governance Command
                                        </span>
                                        <button
                                            onClick={() => handleToggleStatus(p.id)}
                                            disabled={isToggling}
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${p.is_active ? 'bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-100 hover:shadow-md' : 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/20 hover:scale-105'}`}
                                            title={p.is_active ? "Decommission" : "Re-activate"}
                                        >
                                            <FiArrowRight size={14} className={p.is_active ? "" : "transform -rotate-45"} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* --- ELITE MODALS --- */}
            {/* Create Modal */}
            {createPortal(
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
                                />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-[32px] w-full max-w-md overflow-hidden relative z-[110] shadow-2xl"
                            >
                                <div className="px-8 py-8 bg-[var(--theme-primary)] text-white relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm"
                                    >
                                        <FiX size={18} />
                                    </button>
                                    <h2 className="text-xl font-black tracking-tight flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center mr-4">
                                            <FiLayers size={20} />
                                        </div>
                                        Initialize Protocol
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2 ml-14">New Administrative Resource</p>
                                </div>

                                <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Identity Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-[14px] text-gray-700"
                                            placeholder="e.g. Apollo Mission"
                                            value={newProject.name}
                                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Master Identifier Code</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-[14px] text-[var(--theme-primary)] font-mono uppercase tracking-widest"
                                            placeholder="PRJ-001"
                                            value={newProject.code}
                                            onChange={e => setNewProject({ ...newProject, code: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isCreating}
                                            type="submit"
                                            className="flex-1 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--theme-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none"
                                        >
                                            {isCreating ? "Deploying..." : "Provision Module"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Assign Modal */}
            {createPortal(
                <AnimatePresence>
                    {isAssignModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAssignModalOpen(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-[32px] w-full max-w-md overflow-hidden relative z-[110] shadow-2xl"
                            >
                                <div className="px-8 py-8 bg-[var(--theme-primary)] text-white relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsAssignModalOpen(false)}
                                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm"
                                    >
                                        <FiX size={18} />
                                    </button>
                                    <h2 className="text-xl font-black tracking-tight flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center mr-4">
                                            <FiUserPlus size={20} />
                                        </div>
                                        Assign Project
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2 ml-14">Assign Employee to Project</p>
                                </div>

                                <form onSubmit={handleAssign} className="p-8 space-y-5">
                                    <EliteSelector
                                        label="Target Personnel"
                                        placeholder="Select Employee"
                                        options={employees}
                                        value={assignment.employee_id}
                                        onChange={(id) => setAssignment({ ...assignment, employee_id: id })}
                                        icon={FiUser}
                                    />
                                    <EliteSelector
                                        label="Destination Project"
                                        placeholder="Select Project"
                                        options={projects.filter(p => p.is_active)}
                                        value={assignment.project_id}
                                        onChange={(id) => setAssignment({ ...assignment, project_id: id })}
                                        icon={FiLayers}
                                    />

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsAssignModalOpen(false)}
                                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isAssigning || !assignment.employee_id || !assignment.project_id}
                                            type="submit"
                                            className="flex-1 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--theme-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isAssigning ? "Syncing..." : "Assign Protocol"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default ProjectAdmin;
