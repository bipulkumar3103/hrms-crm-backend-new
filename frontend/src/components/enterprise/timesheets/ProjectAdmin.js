import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { FiPlus, FiUserPlus, FiLayers, FiInfo, FiList, FiSearch, FiChevronDown, FiHash, FiUser, FiArrowRight, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import EliteSelector from '../../common/EliteSelector';

const ProjectAdmin = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [newProject, setNewProject] = useState({ name: '', code: '', description: '' });
    const [assignment, setAssignment] = useState({ employee_id: '', project_id: '' });
    const [createMsg, setCreateMsg] = useState('');
    const [assignMsg, setAssignMsg] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        loadData();
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
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateMsg('');
        try {
            await api.post('/timesheets/admin/projects', newProject);
            setCreateMsg('Success: Identity registry entry created.');
            setNewProject({ name: '', code: '', description: '' });
            loadData();
        } catch (err) {
            setCreateMsg(`Error: ${err.response?.data?.error || 'Synchronization failure'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setIsAssigning(true);
        setAssignMsg('');
        try {
            await api.post('/timesheets/admin/assign', assignment);
            setAssignMsg('Success: Personnel mapping verified.');
            setAssignment({ employee_id: '', project_id: '' });
        } catch (err) {
            setAssignMsg(`Error: ${err.response?.data?.error || 'Protocol failed'}`);
        } finally {
            setIsAssigning(false);
        }
    };

    const [expandedId, setExpandedId] = useState(null);
    const [isToggling, setIsToggling] = useState(false);

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

    return (
        <div className="nx-ts-animate w-full">
            {/* Elite Header Area */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center nx-ts-text-primary">
                        <FiLayers size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-none mb-1">Master Code Registry</h1>
                        <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.25em]">Governance Protocol & Resource Provisioning</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                        <FiList className="nx-ts-text-primary" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{projects.length} Registered Identifiers</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Unified Administrative Toolkit */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="nx-ts-card"
                >
                    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-50">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[var(--theme-primary)] shadow-sm">
                            <FiPlus size={18} />
                        </div>
                        <div className="m-0 text-[17px] font-black text-gray-800 tracking-tight">Administrative Resource Provisioning</div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Column 1: Project Initialization */}
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--theme-primary)] mb-4">Initialize New Entity</h3>
                            <form onSubmit={handleCreateProject} className="space-y-5">
                                <div className="nx-ts-form-group">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2 block">Project Identity</label>
                                    <div className="nx-ts-input-wrap flex items-center gap-3 px-5 transition-all focus-within:ring-2 focus-within:ring-[var(--theme-primary)]" style={{ height: '52px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #f1f5f9' }}>
                                        <div className="text-gray-400"><FiLayers size={17} /></div>
                                        <input
                                            className="bg-transparent border-none outline-none w-full text-[13.5px] font-semibold text-gray-700"
                                            placeholder="e.g. Apollo Mission Control"
                                            required
                                            value={newProject.name}
                                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="nx-ts-form-group">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2 block">Master Identifier (Code)</label>
                                    <div className="nx-ts-input-wrap flex items-center gap-3 px-5 transition-all focus-within:ring-2 focus-within:ring-[var(--theme-primary)]" style={{ height: '52px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #f1f5f9' }}>
                                        <div className="text-gray-400"><FiHash size={17} /></div>
                                        <input
                                            className="bg-transparent border-none outline-none w-full text-[13.5px] font-semibold text-gray-700"
                                            placeholder="e.g. PRJ-2024-001"
                                            required
                                            value={newProject.code}
                                            onChange={e => setNewProject({ ...newProject, code: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className={`w-full py-4 text-xs font-black tracking-widest transition-all ${(!newProject.name || !newProject.code) ? 'cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.02] shadow-lg'}`}
                                    style={{
                                        height: '52px',
                                        borderRadius: '14px',
                                        backgroundColor: (!newProject.name || !newProject.code) ? 'var(--theme-bg, #f1f5f9)' : 'var(--theme-primary)',
                                        color: (!newProject.name || !newProject.code) ? '#94a3b8' : '#ffffff',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    disabled={isCreating || !newProject.name || !newProject.code}
                                >
                                    {isCreating ? 'Deploying...' : 'PROVISION MODULE'}
                                </button>
                                {createMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`mt-4 nx-ts-msg text-[11px] font-bold py-3 px-4 rounded-xl border ${createMsg.startsWith('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-indigo-50 border-indigo-100 text-[var(--theme-primary)]'}`}
                                    >
                                        {createMsg}
                                    </motion.div>
                                )}
                            </form>
                        </div>

                        {/* Column 2: Personnel Assignment */}
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--theme-primary)] mb-4">Personnel Mapping Protocol</h3>
                            <form onSubmit={handleAssign} className="space-y-5">
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
                                    options={projects}
                                    value={assignment.project_id}
                                    onChange={(id) => setAssignment({ ...assignment, project_id: id })}
                                    icon={FiLayers}
                                />
                                <button
                                    type="submit"
                                    className={`w-full py-4 text-xs font-black tracking-widest transition-all ${(!assignment.employee_id || !assignment.project_id) ? 'cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.02] shadow-lg'}`}
                                    style={{
                                        height: '52px',
                                        borderRadius: '14px',
                                        backgroundColor: (!assignment.employee_id || !assignment.project_id) ? 'var(--theme-bg, #f1f5f9)' : 'var(--theme-primary)',
                                        color: (!assignment.employee_id || !assignment.project_id) ? '#94a3b8' : '#ffffff',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    disabled={isAssigning || !assignment.employee_id || !assignment.project_id}
                                >
                                    {isAssigning ? 'Synchronizing...' : 'VERIFY PERSONNEL MAPPING'}
                                </button>
                                {assignMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mt-3 nx-ts-msg text-[11px] font-bold py-3 px-4 rounded-xl border ${assignMsg.startsWith('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-700'}`}
                                    >
                                        {assignMsg}
                                    </motion.div>
                                )}
                            </form>
                        </div>
                    </div>
                </motion.div>

                {/* Registry View - Vertical Accordion Protocol */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <div className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Active Identifier Registry</div>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence mode="wait">
                            {projects.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400 text-sm font-semibold italic shadow-sm"
                                >
                                    No active identifiers discovered in the registry.
                                </motion.div>
                            ) : (
                                projects.map((p, idx) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        layout
                                        className={`overflow-hidden transition-all duration-300 rounded-2xl border ${expandedId === p.id ? 'border-[var(--theme-primary)] shadow-xl ring-4 ring-indigo-50/50' : 'border-gray-100 shadow-sm'} ${!p.is_active ? 'bg-[var(--theme-bg)] opacity-70 grayscale' : 'bg-white'}`}
                                    >
                                        {/* Accordion Trigger */}
                                        <div
                                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner ${p.is_active ? 'bg-gray-50 text-[var(--theme-primary)]' : 'bg-gray-200 text-gray-400'}`}>
                                                    <FiHash size={24} />
                                                </div>
                                                <div>
                                                    <div className={`text-[10px] font-black tracking-widest uppercase mb-1 ${p.is_active ? 'text-[var(--theme-primary)]' : 'text-gray-400 line-through'}`}>{p.code}</div>
                                                    <h4 className={`m-0 text-base font-black tracking-tight transition-colors ${p.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{p.name}</h4>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`hidden sm:flex px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${p.is_active ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] border-[var(--theme-primary)]' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                    {p.is_active ? 'Active Protocol' : 'Decommissioned'}
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: expandedId === p.id ? 180 : 0 }}
                                                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300"
                                                >
                                                    <FiChevronDown size={22} />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Accordion Content */}
                                        <AnimatePresence>
                                            {expandedId === p.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-gray-50 bg-gray-50/30 overflow-hidden"
                                                >
                                                    <div className="p-8 flex flex-col md:flex-row items-end justify-between gap-6">
                                                        <div className="max-w-xl">
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-3">Resource Metadata</div>
                                                            <p className="text-sm font-semibold text-gray-500 italic leading-relaxed">
                                                                {p.description || "No metadata provided for this identifier. This entity is currently being tracked within the internal governance registry."}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-stretch gap-3 min-w-[220px]">
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1">Entity Governance</div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(p.id); }}
                                                                disabled={isToggling}
                                                                className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-md ${p.is_active ? 'bg-white text-red-500 border border-red-100 hover:bg-red-50' : 'bg-[var(--theme-primary)] text-white hover:scale-[1.02]'}`}
                                                            >
                                                                {isToggling ? 'Processing...' : (p.is_active ? 'Decommission Project' : 'Activate Project')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectAdmin;
