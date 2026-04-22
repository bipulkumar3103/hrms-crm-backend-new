import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus, FiBriefcase, FiAperture, FiTrash2, FiEdit3,
    FiChevronDown, FiChevronRight, FiCheck, FiX, FiLayers,
    FiUserCheck, FiTarget, FiActivity, FiCpu
} from 'react-icons/fi';
import { api } from '../../utils/api';
import PremiumLoader from '../PremiumLoader';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';

const OrganizationRegistry = () => {
    const { token } = useAuth();
    const { showAlert } = useAlert();
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);

    // Form States
    const [newDept, setNewDept] = useState({ name: '', description: '' });
    const [newDesig, setNewDesig] = useState({ name: '', description: '', department_id: null });
    const [editingDesig, setEditingDesig] = useState(null);
    const [editingDept, setEditingDept] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDepartments();

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsAddDeptModalOpen(false);
                setEditingDept(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/organization/departments');
            setDepartments(response.data);
        } catch (error) {
            showAlert("Failed to synchronize organization registry.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalDepts = departments.length;
        const totalDesigs = departments.reduce((acc, d) => acc + (d.designations?.length || 0), 0);
        return { totalDepts, totalDesigs };
    }, [departments]);

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/organization/departments', newDept);
            showAlert("Department successfully established.", "success");
            setNewDept({ name: '', description: '' });
            setIsAddDeptModalOpen(false);
            fetchDepartments();
        } catch (error) {
            showAlert(error.response?.data?.message || "Protocol failure during creation.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddDesignation = async (deptId, name) => {
        if (!name) return;
        setIsSubmitting(true);
        try {
            await api.post('/organization/designations', {
                name: name,
                description: '',
                department_id: deptId
            });
            showAlert("Designation anchored to department.", "success");
            fetchDepartments();
        } catch (error) {
            showAlert("Failed to anchor designation.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateDepartment = async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/organization/departments/${editingDept.id}`, {
                name: editingDept.name,
                description: editingDept.description
            });
            showAlert("Department successfully updated.", "success");
            setEditingDept(null);
            fetchDepartments();
        } catch (error) {
            showAlert(error.response?.data?.message || "Protocol failure during update.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateDesignation = async (id, newName) => {
        if (!newName || newName.trim() === '') return setEditingDesig(null);
        setIsSubmitting(true);
        try {
            await api.put(`/organization/designations/${id}`, { name: newName });
            showAlert("Designation updated.", "success");
            fetchDepartments();
        } catch (error) {
            showAlert("Failed to update designation.", "error");
        } finally {
            setIsSubmitting(false);
            setEditingDesig(null);
        }
    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm("Confirm decommissioning of this department?")) return;
        try {
            await api.delete(`/organization/departments/${id}`);
            showAlert("Department decommissioned.", "success");
            fetchDepartments();
        } catch (error) {
            showAlert(error.response?.data?.message || "Decommissioning blocked.", "error");
        }
    };

    const handleDeleteDesig = async (id) => {
        try {
            await api.delete(`/organization/designations/${id}`);
            showAlert("Designation purged.", "success");
            fetchDepartments();
        } catch (error) {
            showAlert(error.response?.data?.message || "Purge blocked.", "error");
        }
    };

    if (isLoading) return <PremiumLoader message="Syncing Hierarchical Registry..." />;

    return (
        <div className="nx-ts-animate w-full flex flex-col gap-6 pb-12">

            {/* --- UNIFIED REGISTRY COMMAND CENTER --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
            >
                {/* MEANINGFUL REGISTRY HEADER */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[var(--theme-primary)] text-white rounded-t-3xl border-b border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black tracking-tight">
                                Organization Registry
                            </h1>
                            <div className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase text-white/90 tracking-tighter">Identity Core</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                            Relational Hierarchy & Operational Designations
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddDeptModalOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10 self-start sm:self-auto"
                    >
                        <FiPlus size={14} /> Add Department
                    </button>
                </div>

                {/* HORIZONTAL NODE STRIP */}
                <div className="bg-slate-50/30 px-6 py-4 sm:px-8 flex flex-wrap items-center gap-10 border-b border-slate-50 uppercase">
                    <div className="flex items-center gap-3">
                        <FiLayers className="text-[var(--theme-primary)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Active Nodes</span>
                            <span className="text-sm font-black text-slate-700">{stats.totalDepts} Departments</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiCpu className="text-[var(--theme-primary)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Current Roll</span>
                            <span className="text-sm font-black text-slate-700">{stats.totalDesigs} Designations</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    {departments.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <FiBriefcase size={32} className="text-slate-200" />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">No Departments Operational</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">Establish your first organizational node to begin mapping.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {departments.map((dept) => (
                                <motion.div
                                    key={dept.id}
                                    layout
                                    className="bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group flex flex-col"
                                >
                                    <div className="p-6 sm:p-7 flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[var(--theme-primary)] flex items-center justify-center group-hover:bg-[var(--theme-primary)] group-hover:text-white transition-all shadow-sm">
                                                <FiLayers size={22} />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingDept({ id: dept.id, name: dept.name, description: dept.description })}
                                                    className="w-8 h-8 rounded-lg text-slate-300 hover:bg-indigo-50 hover:text-[var(--theme-primary)] transition-all flex items-center justify-center"
                                                >
                                                    <FiEdit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDept(dept.id)}
                                                    className="w-8 h-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-[16px] font-black text-slate-800 tracking-tight mb-1">{dept.name}</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed opacity-70">MTD Operations Registry</p>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">
                                                <span>Designations ({dept.designations?.length || 0})</span>
                                                <FiActivity size={10} className="opacity-40" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-2 nx-ts-scroll-common">
                                                {dept.designations?.map(desig => (
                                                    <div key={desig.id} className="flex justify-between items-center bg-slate-50/70 py-2 px-3 rounded-xl text-[12px] font-bold text-slate-600 border border-slate-100/50 hover:border-slate-200 group/item transition-all">
                                                        {editingDesig?.id === desig.id ? (
                                                            <input 
                                                                autoFocus
                                                                className="flex-1 bg-white border border-[var(--theme-primary)] rounded px-2 py-1 text-[12px] outline-none mr-2 w-full"
                                                                value={editingDesig.name}
                                                                onChange={(e) => setEditingDesig({...editingDesig, name: e.target.value})}
                                                                onBlur={() => handleUpdateDesignation(desig.id, editingDesig.name)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdateDesignation(desig.id, editingDesig.name);
                                                                    if (e.key === 'Escape') setEditingDesig(null);
                                                                }}
                                                            />
                                                        ) : (
                                                            <>
                                                                <span className="truncate mr-2">{desig.name}</span>
                                                                <div className="opacity-0 group-hover/item:opacity-100 shrink-0 flex gap-1">
                                                                    <button
                                                                        onClick={() => setEditingDesig({ id: desig.id, name: desig.name })}
                                                                        className="w-5 h-5 rounded-md hover:bg-indigo-100 hover:text-[var(--theme-primary)] flex items-center justify-center transition-all"
                                                                    >
                                                                        <FiEdit3 size={10} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteDesig(desig.id)}
                                                                        className="w-5 h-5 rounded-md hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all"
                                                                    >
                                                                        <FiX size={10} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                        </div>
                                    </div>

                                    {/* Action Anchor */}
                                    <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-50 rounded-b-[28px]">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Anchor Designation..."
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold text-slate-800 focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all placeholder-slate-400"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAddDesignation(dept.id, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousSibling;
                                                    handleAddDesignation(dept.id, input.value);
                                                    input.value = '';
                                                }}
                                                className="w-10 h-10 bg-[var(--theme-primary)] text-white rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-95 transition-all"
                                            >
                                                <FiPlus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* HIGH-FIDELITY MODAL */}
            {createPortal(
                <AnimatePresence>
                    {isAddDeptModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAddDeptModalOpen(false)}
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
                                        onClick={() => setIsAddDeptModalOpen(false)}
                                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm"
                                    >
                                        <FiX size={18} />
                                    </button>
                                    <h2 className="text-xl font-black tracking-tight flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center mr-4">
                                            <FiLayers size={20} />
                                        </div>
                                        Department
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2 ml-14">New Organizational Department</p>
                                </div>

                                <form onSubmit={handleAddDepartment} className="p-8 space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Functional Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-[14px] text-slate-700"
                                            placeholder="e.g. Strategic Operations"
                                            value={newDept.name}
                                            onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Operational Description</label>
                                        <textarea
                                            rows="3"
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-[14px] text-slate-700 resize-none"
                                            placeholder="Operational scope and objectives..."
                                            value={newDept.description}
                                            onChange={e => setNewDept({ ...newDept, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddDeptModalOpen(false)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isSubmitting}
                                            type="submit"
                                            className="flex-1 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            {isSubmitting ? "Establishing..." : "Save Protocol"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* HIGH-FIDELITY EDIT DEPARTMENT MODAL */}
            {createPortal(
                <AnimatePresence>
                    {editingDept && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setEditingDept(null)}
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
                                        onClick={() => setEditingDept(null)}
                                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-sm"
                                    >
                                        <FiX size={18} />
                                    </button>
                                    <h2 className="text-xl font-black tracking-tight flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center mr-4">
                                            <FiEdit3 size={20} />
                                        </div>
                                        Edit Department
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2 ml-14">Update Protocol Name</p>
                                </div>

                                <form onSubmit={handleUpdateDepartment} className="p-8 space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Functional Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[var(--theme-primary)] outline-none transition-all font-bold text-[14px] text-slate-700"
                                            value={editingDept.name}
                                            onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingDept(null)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isSubmitting}
                                            type="submit"
                                            className="flex-1 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            {isSubmitting ? "Syncing..." : "Update Protocol"}
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

export default OrganizationRegistry;
