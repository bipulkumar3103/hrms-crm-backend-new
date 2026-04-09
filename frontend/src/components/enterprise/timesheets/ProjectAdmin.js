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
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center nx-ts-text-primary">
                        <FiLayers size={20} className="sm:hidden" />
                        <FiLayers size={24} className="hidden sm:block" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1">Master Code Registry</h1>
                        <p className="text-gray-400 font-semibold uppercase text-[8px] sm:text-[9px] tracking-[0.2em] whitespace-nowrap overflow-hidden text-ellipsis">Governance Protocol & Resource Provisioning</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm justify-center sm:justify-start">
                        <FiList className="nx-ts-text-primary" size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{projects.length} <span className="hidden xs:inline">Registered</span> Identifiers</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Unified Administrative Toolkit */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                    style={{ 
                        background: 'white',
                        border: '1px solid #f1f5f9',
                        borderRadius: '24px',
                        overflow: 'visible',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                    }}
                >
                    {/* Section Header — Company Theme */}
                    <div
                        className="flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-5 sm:py-6"
                        style={{ 
                            backgroundColor: 'var(--theme-primary)',
                            borderRadius: '24px 24px 0 0'
                        }}
                    >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <FiPlus size={16} className="text-white sm:hidden" />
                            <FiPlus size={18} className="text-white hidden sm:block" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-white font-bold text-sm sm:text-[15px] tracking-tight leading-none truncate">Administrative Resource Provisioning</div>
                            <div className="text-white/60 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.15em] mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">Entity Creation & Personnel Binding</div>
                        </div>
                    </div>

                    {/* Two-Panel Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100" style={{ borderRadius: '0 0 24px 24px', overflow: 'visible' }}>

                        <div className="p-6 sm:p-8 space-y-5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-secondary, #ede9fe)' }}>
                                    <FiLayers size={13} style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--theme-primary)' }}>Initialize New Entity</h3>
                            </div>


                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2 px-1">Project Identity</label>
                                    <div className="nx-ts-input-wrap flex items-center justify-between transition-all px-0 border-gray-200 hover:border-[var(--theme-primary)]" style={{ height: '52px', background: 'white', borderRadius: '14px' }}>
                                        <div className="flex items-center flex-1 overflow-hidden px-5 gap-3">
                                            <FiLayers size={18} className="text-gray-300 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none w-full text-[13px] font-semibold text-gray-700 placeholder-gray-400"
                                                placeholder="e.g. Apollo Mission Control"
                                                required
                                                value={newProject.name}
                                                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2 px-1">Master Identifier (Code)</label>
                                    <div className="nx-ts-input-wrap flex items-center justify-between transition-all px-0 border-gray-200 hover:border-[var(--theme-primary)]" style={{ height: '52px', background: 'white', borderRadius: '14px' }}>
                                        <div className="flex items-center flex-1 overflow-hidden px-5 gap-3">
                                            <FiHash size={18} className="text-gray-300 flex-shrink-0" />
                                            <input
                                                className="bg-transparent border-none outline-none w-full text-[13px] font-semibold text-gray-700 placeholder-gray-400 font-mono"
                                                placeholder="e.g. PRJ-2024-001"
                                                required
                                                value={newProject.code}
                                                onChange={e => setNewProject({ ...newProject, code: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating || !newProject.name || !newProject.code}
                                    className="w-full flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-200"
                                    style={{
                                        height: '52px', borderRadius: '14px', border: 'none',
                                        backgroundColor: (!newProject.name || !newProject.code) ? '#f1f5f9' : 'var(--theme-primary)',
                                        color: (!newProject.name || !newProject.code) ? '#94a3b8' : '#ffffff',
                                        cursor: (!newProject.name || !newProject.code) ? 'not-allowed' : 'pointer',
                                        opacity: isCreating ? 0.75 : 1,
                                    }}
                                >
                                    {isCreating
                                        ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deploying...</>
                                        : <><FiArrowRight size={14} /> Provision Module</>
                                    }
                                </button>

                                <AnimatePresence>
                                    {createMsg && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className={`text-[11px] font-bold py-3 px-4 rounded-xl border ${createMsg.startsWith('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'border text-[var(--theme-primary)]'}`}
                                            style={!createMsg.startsWith('Error') ? { backgroundColor: 'var(--theme-secondary, #ede9fe)', borderColor: 'var(--theme-primary)' } : {}}
                                        >
                                            {createMsg}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>

                        {/* Panel 2: Personnel Binding */}
                        <div className="p-6 sm:p-8 space-y-5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-secondary, #ede9fe)' }}>
                                    <FiUserPlus size={13} style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--theme-primary)' }}>Personnel Mapping Protocol</h3>
                            </div>

                            <form onSubmit={handleAssign} className="space-y-4">
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
                                    disabled={isAssigning || !assignment.employee_id || !assignment.project_id}
                                    className="w-full flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-200"
                                    style={{
                                        height: '52px', borderRadius: '14px', border: 'none',
                                        backgroundColor: (!assignment.employee_id || !assignment.project_id) ? '#f1f5f9' : 'var(--theme-primary)',
                                        color: (!assignment.employee_id || !assignment.project_id) ? '#94a3b8' : '#ffffff',
                                        cursor: (!assignment.employee_id || !assignment.project_id) ? 'not-allowed' : 'pointer',
                                        opacity: isAssigning ? 0.75 : 1,
                                    }}
                                >
                                    {isAssigning
                                        ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Synchronizing...</>
                                        : <><FiArrowRight size={14} /> Verify Personnel Mapping</>
                                    }
                                </button>

                                <AnimatePresence>
                                    {assignMsg && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className={`text-[11px] font-bold py-3 px-4 rounded-xl border ${assignMsg.startsWith('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-700'}`}
                                        >
                                            {assignMsg}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>
                    </div>
                </motion.div>

                {/* Registry View - Vertical Accordion Protocol */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-gray-400">Active Identifier Registry</div>
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
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner ${p.is_active ? 'bg-gray-50 text-[var(--theme-primary)]' : 'bg-gray-200 text-gray-400'}`}>
                                                    <FiHash size={24} />
                                                </div>
                                                <div>
                                                    <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${p.is_active ? 'text-[var(--theme-primary)]' : 'text-gray-400 line-through'}`}>{p.code}</div>
                                                    <h4 className={`m-0 text-base font-bold tracking-tight transition-colors ${p.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{p.name}</h4>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`hidden sm:flex px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] border transition-all ${p.is_active ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] border-[var(--theme-primary)]' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
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
                                                    <div className="p-6 sm:p-8 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6">
                                                        <div className="max-w-xl">
                                                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">Resource Metadata</div>
                                                            <div className="text-base font-bold text-[var(--theme-primary)] mb-2">{p.total_hours}h Total Recorded</div>
                                                            <p className="text-[13px] font-semibold text-gray-500 italic leading-relaxed">
                                                                {p.description || "No metadata provided for this identifier. This entity is currently being tracked within the internal governance registry."}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-stretch gap-3 min-w-[220px]">
                                                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">Entity Governance</div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(p.id); }}
                                                                disabled={isToggling}
                                                                className={`w-full py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-md active:scale-95 ${p.is_active ? 'bg-white text-red-500 border border-red-100 hover:bg-red-50' : 'bg-[var(--theme-primary)] text-white hover:scale-[1.02]'}`}
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
