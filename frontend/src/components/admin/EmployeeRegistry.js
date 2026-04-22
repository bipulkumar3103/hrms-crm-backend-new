import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
    FiUsers, FiSearch, FiFilter, FiUser, FiMail, FiBriefcase,
    FiLayers, FiTarget, FiChevronDown, FiPlus, FiArrowRight,
    FiX, FiSave, FiEdit2, FiInfo, FiClock, FiShield, FiHash, FiList,
    FiCheckCircle, FiSettings, FiActivity
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumLoader from '../PremiumLoader';
import EliteSelector from '../common/EliteSelector';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';

const EmployeeRegistry = () => {
    const { token, user } = useAuth();
    const { showAlert } = useAlert();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Administrative Access Logic (Admin, Superadmin, or HR Department)
    const isPrivileged = user?.roles?.includes('admin') || user?.roles?.includes('superadmin');
    const isHr = user?.department?.toUpperCase().includes('HR') || user?.dept_relationship?.name?.toUpperCase().includes('HR');
    const canManage = isPrivileged || isHr;

    // Selection State for Editing
    const [editTarget, setEditTarget] = useState(null);

    const loadEmployees = async () => {
        try {
            const res = await api.get('/employees/all');
            setEmployees(res.data);
            return true;
        } catch (err) {
            console.error("Employee fetching error:", err);
            showAlert("Synchronization failure: Employee registry inaccessible", "error");
            return false;
        }
    };

    const loadDepartments = async () => {
        try {
            const res = await api.get('/organization/departments');
            setDepartments(res.data);
            return true;
        } catch (err) {
            console.error("Department fetching error:", err);
            showAlert("Synchronization failure: Structural clusters inaccessible", "error");
            return false;
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([loadEmployees(), loadDepartments()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateEmployee = async (e) => {
        if (e) e.preventDefault();
        if (!editTarget) return;
        setIsSaving(true);
        try {
            await api.put(`/users/${editTarget.id}`, editTarget);
            showAlert(`Record for ${editTarget.name} synchronized successfully`, "success");
            loadData();
            // Keep expanded if possible or reset
        } catch (err) {
            showAlert(err.response?.data?.message || "Protocol synchronization failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectForEdit = (emp) => {
        setEditTarget({ ...emp });
        setExpandedId(emp.id);
        // Scroll to edit panel if needed, but for now just set state
    };

    if (loading) return <PremiumLoader message="Fetching Network Identity..." />;

    return (
        <div className="nx-ts-animate w-full space-y-8">
            {/* --- MATRIX COMMAND HEADER --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden"
            >
                {/* PRIMARY IDENTITY HEADER */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[var(--theme-primary)] text-white border-b border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black tracking-tight">Personnel Network Registry</h1>
                            <div className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase text-white/90 tracking-tighter">Strategic Cluster</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Organizational Hierarchy & Governance Protocol</p>
                    </div>

                    <div className="relative z-10 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <FiShield className="text-yellow-400" /> Administrative Access Secured
                    </div>

                    {/* Background decorations */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                </div>

                {/* ENTERPRISE INTELLIGENCE STRIP (Secondary Zone) */}
                <div className="bg-[var(--theme-secondary)]/10 px-6 py-4 sm:px-8 flex flex-wrap items-center gap-10 border-b border-slate-50 uppercase">
                    <div className="flex items-center gap-3">
                        <FiUsers className="text-[var(--theme-primary)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Total Registered</span>
                            <span className="text-sm font-black text-slate-700">{employees.length} Identifiers</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiCheckCircle className="text-emerald-500" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Active Nodes</span>
                            <span className="text-sm font-black text-slate-700 uppercase">{employees.filter(e => e.status === 'active').length} Verified</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiClock className="text-[var(--theme-accent)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Pending Sync</span>
                            <span className="text-sm font-black text-slate-700">{employees.filter(e => e.status === 'invited').length} Awaiting</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiLayers className="text-[var(--theme-primary)]" size={16} />
                        <div>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest block leading-none mb-1">Structural Depth</span>
                            <span className="text-sm font-black text-slate-700">{departments.length} Clusters</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- ADMINISTRATIVE PROVISIONING HUB (Matrix Engine) --- */}
            {canManage && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="w-full bg-white border border-slate-100 rounded-[32px] shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/30 relative z-20 overflow-hidden"
                >
                    {/* HUB COMMAND HEADER */}
                    <div className="px-8 py-8 bg-[var(--theme-primary)] text-white flex items-center justify-between relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-14 h-14 rounded-[20px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                                <FiSettings size={26} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight leading-none uppercase mb-2">Personnel Provisioning Engine</h2>
                                <div className="flex items-center gap-3">
                                    <div className="px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Administrative Gateway</div>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Synchronized Cluster
                                    </p>
                                </div>
                            </div>
                        </div>

                        {editTarget && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative z-10 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center gap-4 group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FiUser size={16} />
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Modifying identity</div>
                                    <div className="text-[14px] font-black tracking-tight leading-none">{editTarget.name}</div>
                                </div>
                            </motion.div>
                        )}

                        {/* Background decoration */}
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                        {/* Panel 1: Structural Identity */}
                        <div className="p-8 space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--theme-primary)]/5 text-[var(--theme-primary)] border border-[var(--theme-primary)]/10 shadow-sm">
                                        <FiBriefcase size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Structural Identity</h3>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 opacity-80 underline underline-offset-4 decoration-slate-100">Functional Cluster Node</p>
                                    </div>
                                </div>

                            {editTarget ? (
                                <div className="space-y-6">
                                    <EliteSelector
                                        label="Primary Departmental Node"
                                        placeholder="Assign Later"
                                        icon={FiLayers}
                                        options={[
                                            { id: '', name: 'Assign Later' },
                                            ...departments.map(d => ({ id: d.id, name: d.name }))
                                        ]}
                                        value={editTarget.department_id}
                                        onChange={(val) => setEditTarget({ ...editTarget, department_id: val, designation_id: '' })}
                                    />

                                    <EliteSelector
                                        label="Functional Operational Designation"
                                        placeholder="Assign Later"
                                        icon={FiTarget}
                                        isDisabled={!editTarget.department_id}
                                        options={[
                                            { id: '', name: 'Assign Later' },
                                            ...(editTarget.department_id ? departments.find(d => String(d.id) === String(editTarget.department_id))?.designations.map(des => ({ id: des.id, name: des.name })) : [])
                                        ]}
                                        value={editTarget.designation_id}
                                        onChange={(val) => setEditTarget({ ...editTarget, designation_id: val })}
                                    />
                                </div>
                            ) : (
                                <div className="py-16 text-center border-2 border-dashed border-slate-50 rounded-[24px] bg-slate-50/20">
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <FiSearch className="text-slate-300" size={20} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Identifier from Registry below</p>
                                </div>
                            )}
                        </div>

                        {/* Panel 2: Hierarchy & Status */}
                        <div className="p-8 space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--theme-accent)]/5 text-[var(--theme-accent)] border border-[var(--theme-accent)]/10 shadow-sm">
                                        <FiShield size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Governance Protocol</h3>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 opacity-80 underline underline-offset-4 decoration-slate-100">Hierarchy Authorization Node</p>
                                    </div>
                                </div>

                            {editTarget ? (
                                <div className="space-y-6">
                                    <EliteSelector
                                        label="Assigned Command Authority (Manager)"
                                        placeholder="Assign Later"
                                        icon={FiUser}
                                        options={[
                                            { id: '', name: 'Assign Later / Direct Report' },
                                            ...employees
                                                .filter(e =>
                                                    e.id !== editTarget.id && (
                                                        (editTarget.department_id && String(e.department_id) === String(editTarget.department_id)) ||
                                                        e.is_privileged
                                                    )
                                                )
                                                .map(e => ({
                                                    id: e.id,
                                                    name: e.name,
                                                    email: e.email,
                                                    icon: e.is_privileged ? <FiShield size={12} className="text-[var(--theme-accent)]" /> : null
                                                }))
                                        ]}
                                        value={editTarget.manager_id}
                                        onChange={(val) => setEditTarget({ ...editTarget, manager_id: val })}
                                    />

                                    <div className="flex flex-col sm:flex-row gap-6 items-stretch sm:items-end">
                                        <div className="flex-1">
                                            <EliteSelector
                                                label="Operational Lifecycle Status"
                                                placeholder="Select Status"
                                                icon={FiActivity}
                                                options={[
                                                    { id: 'invited', name: 'INVITED (PENDING)' },
                                                    { id: 'active', name: 'ACTIVE (STABLE)' },
                                                    { id: 'inactive', name: 'INACTIVE (LOCKED)' }
                                                ]}
                                                value={editTarget.status}
                                                onChange={(val) => setEditTarget({ ...editTarget, status: val })}
                                            />
                                        </div>
                                          <button
                                              onClick={handleUpdateEmployee}
                                              disabled={isSaving}
                                              className="h-[52px] px-10 bg-[var(--theme-primary)] text-white rounded-[16px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                                              style={{ boxShadow: '0 10px 30px -5px var(--theme-primary-border)' }}
                                          >
                                              {isSaving ? 'SYNCING...' : <><FiSave size={16} /> Deploy Changes</>}
                                          </button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="py-16 text-center border-2 border-dashed border-slate-50 rounded-[24px] bg-slate-50/20">
                                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                          <FiActivity className="text-slate-300" size={20} />
                                      </div>
                                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Awaiting Strategic Identity Context</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </motion.div>
              )}
  
              {/* Registry View - Vertical Strategic Protocol */}
              <div className="space-y-6">
                  <div className="flex items-center justify-between px-4 mb-2">
                      <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                          <div className="text-[12px] font-black uppercase tracking-[0.25em] text-slate-400">Personnel Identifier Registry</div>
                      </div>
                      <div className="relative group">
                          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-[var(--theme-primary)] transition-colors" size={14} />
                          <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Identification Lookup..."
                              className="pl-10 pr-4 py-2.5 text-[11px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl outline-none focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/10 transition-all w-64 shadow-sm"
                          />
                      </div>
                  </div>
  
                  <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                          {employees
                              .filter(emp => 
                                  !searchTerm || 
                                  emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  emp.department.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((emp, idx) => (
                              <motion.div
                                  key={emp.id}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  layout
                                  className={`overflow-hidden transition-all duration-300 rounded-[32px] border ${expandedId === emp.id ? 'border-[var(--theme-primary)] shadow-2xl ring-4 ring-[var(--theme-primary)]/5' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'} bg-white group/card`}
                                  style={expandedId === emp.id ? { boxShadow: '0 20px 50px -10px var(--theme-primary-border)' } : {}}
                              >
                                {/* Accordion Trigger (Identity Badge) */}
                                <div
                                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-6">
                                            {/* Identity Insignia */}
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-[40px] bg-slate-50 border border-slate-100 flex items-center justify-center text-[var(--theme-primary)] font-black text-2xl shadow-inner uppercase transition-transform group-hover/card:scale-105">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
                                                    emp.status === 'active' ? 'bg-emerald-500' : 
                                                    emp.status === 'invited' ? 'bg-[var(--theme-accent)]' : 'bg-slate-300'
                                                }`} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black tracking-widest uppercase mb-1.5 text-slate-400 flex items-center gap-2">
                                                    {emp.email}
                                                    {emp.is_privileged && <span className="px-1.5 py-0.5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 text-[8px]">PRIVILEGED</span>}
                                                </div>
                                                <h4 className="m-0 text-lg font-black tracking-tight text-slate-800">{emp.name}</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:flex flex-col items-end">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Operational Cluster</span>
                                                <div className="px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-[0.15em] border bg-slate-50 text-slate-600 border-slate-100 group-hover/card:border-[var(--theme-secondary)] transition-colors">
                                                    {emp.department}
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedId === emp.id ? 180 : 0 }}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors 
                                                    ${expandedId === emp.id ? 'bg-[var(--theme-secondary)]/30 text-[var(--theme-primary)]' : 'bg-slate-50 text-slate-300'}`}
                                            >
                                                <FiChevronDown size={22} />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Accordion Content (Strategic Profile) */}
                                <AnimatePresence>
                                    {expandedId === emp.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-50 bg-slate-50/20 overflow-hidden"
                                        >
                                            <div className="p-10 flex flex-col xl:flex-row items-stretch xl:items-end justify-between gap-10">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-10">
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Structural Node</div>
                                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                                                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-secondary)]/20 flex items-center justify-center text-[var(--theme-primary)]">
                                                                <FiLayers size={18} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">Department</span>
                                                                <span className="text-[13px] font-black text-slate-700">{emp.department}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Functional Identity</div>
                                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                                                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 flex items-center justify-center text-[var(--theme-primary)]">
                                                                <FiTarget size={18} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">Designation</span>
                                                                <span className="text-[13px] font-black text-slate-700">{emp.job_title}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Governance Access</div>
                                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                                                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 flex items-center justify-center text-[var(--theme-accent)]">
                                                                <FiShield size={18} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-300 uppercase block mb-0.5">Manager</span>
                                                                <span className="text-[13px] font-black text-slate-700">{emp.manager_name || 'Direct Command'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-stretch gap-4 min-w-[240px]">
                                                    {canManage && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSelectForEdit(emp); }}
                                                            className="w-full py-5 rounded-2xl bg-[var(--theme-primary)] text-white text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                                        >
                                                            <FiEdit2 size={16} /> Engage Provisioning
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default EmployeeRegistry;
