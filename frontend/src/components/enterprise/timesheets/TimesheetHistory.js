import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../utils/api';
import { FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiArrowRight, FiEye, FiX, FiEdit3, FiSend, FiList, FiAlertCircle, FiActivity, FiMessageSquare } from 'react-icons/fi';
import { useAlert } from '../../../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const TimesheetHistory = ({ user }) => {
    const { showAlert } = useAlert();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);
    const [selectedReviewer, setSelectedReviewer] = useState(null);

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = () => {
        setLoading(true);
        api.get('/timesheets/my-submissions')
            .then(res => {
                setSubmissions(res.data);
                setLoading(false);
            })
            .catch(err => {
                showAlert("Consultation failed: Unable to synchronize historical logs.", "error");
                setLoading(false);
            });
    };

    const metrics = useMemo(() => {
        const approved = submissions.filter(s => s.status === 'APPROVED').length;
        const pending = submissions.filter(s => s.status === 'PENDING').length;
        return { total: submissions.length, approved, pending };
    }, [submissions]);

    const handleViewDetails = (id, forceEdit = false) => {
        setDetailsLoading(true);
        api.get(`/timesheets/details/${id}`)
            .then(res => {
                setSelectedSheet(res.data);
                setIsResubmitting(forceEdit || res.data.status === 'REJECTED');
                setDetailsLoading(false);
            })
            .catch(err => {
                showAlert("Entry detail retrieval failure.", "error");
                setDetailsLoading(false);
            });
    };

    const handleUpdateDay = (idx, field, value) => {
        const newDays = [...selectedSheet.days];
        newDays[idx][field] = value;
        setSelectedSheet({ ...selectedSheet, days: newDays });
    };

    const handleConfirmResubmit = async () => {
        setDetailsLoading(true);
        try {
            await api.post('/timesheets/resubmit', {
                timesheet_id: selectedSheet.id,
                days: selectedSheet.days
            });
            showAlert("Protocol resubmitted. Synchronizing registry...", "success");
            setTimeout(() => {
                setSelectedSheet(null);
                loadSubmissions();
            }, 1000);
        } catch (err) {
            showAlert(err.response?.data?.message || "Resubmission protocol failure.", "error");
        } finally {
            setDetailsLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-100">Approved</span>;
            case 'REJECTED':
                return <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-100">Rejected</span>;
            case 'PENDING':
                return <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending</span>;
            default:
                return <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100">{status}</span>;
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Synchronizing History...</div>;

    return (
        <div className="nx-ts-animate w-full flex flex-col gap-6 pb-12">

            {/* --- HISTORICAL AUDIT HUB --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
            >
                {/* Hub Identity Header */}
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--theme-primary)] border border-slate-100">
                            <FiList size={22} />
                        </div>
                        <div>
                            <div className="text-slate-800 font-black text-base tracking-tight leading-none uppercase">Historical Performance Audit</div>
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                <span className="text-[var(--theme-primary)]">{submissions.length}</span> Synchronized Intelligence Logs
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                            <span className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">{metrics.approved} Finalized</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                            <span className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">{metrics.pending} in Process</span>
                        </div>
                    </div>
                </div>

                <div className="p-0">
                    {submissions.length === 0 ? (
                        <div className="py-24 text-center px-10">
                            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <FiCalendar size={32} className="text-slate-200" />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">No Historical Records</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                                Start filling your sheets in the console to populate your audit trail.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto nx-ts-scroll-common">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/10">
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[260px]">Temporal Identity</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Strategic assignment</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Quantum</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Governance</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Reviewer Node</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-[100px]">audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {submissions.map((s) => (
                                        <tr key={s.id} className="transition-all duration-300 hover:bg-[var(--theme-primary)]/[0.02] group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-white group-hover:text-[var(--theme-primary)] group-hover:shadow-lg transition-all duration-500" style={{ boxShadow: '0 8px 24px -4px var(--theme-primary-border)' }}>
                                                        <FiCalendar size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-black text-slate-700 flex items-center gap-2 group-hover:text-[var(--theme-primary)] transition-colors">
                                                            {s.start_date} <FiArrowRight size={10} className="text-slate-200" /> {s.end_date}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-slate-200" /> Protocol #{String(s.id).slice(-4).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`text-[14px] font-black tracking-tight leading-none ${s.project_is_active === false ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                                                    {s.project_name}
                                                </div>
                                                {s.project_is_active === false && <div className="text-[8px] font-black text-amber-500 uppercase tracking-tighter mt-1.5 bg-amber-50 px-1.5 py-0.5 rounded inline-block">Decommissioned</div>}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-[14px] font-black text-slate-800 group-hover:scale-110 inline-block transition-transform">{s.total_hours}h</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {getStatusBadge(s.status)}
                                            </td>
                                            <td className="px-8 py-6">
                                                {s.reviewer ? (
                                                    <div
                                                        onClick={() => setSelectedReviewer(s.reviewer)}
                                                        className="flex items-center gap-3 cursor-pointer group/rev"
                                                    >
                                                        <div className="relative">
                                                            {s.reviewer.avatarUrl ? (
                                                                <img src={s.reviewer.avatarUrl} alt="Reviewer" className="w-9 h-9 rounded-xl object-cover border-2 border-white shadow-sm group-hover/rev:border-[var(--theme-primary)] transition-all" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 font-black text-[12px] flex items-center justify-center border border-slate-100 group-hover/rev:border-[var(--theme-primary)]/20 transition-all">
                                                                    {s.reviewer.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center border border-slate-50">
                                                                <FiCheckCircle size={8} className="text-emerald-500" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[12px] font-black text-slate-700 group-hover/rev:text-[var(--theme-primary)] transition-colors tracking-tight leading-none">{s.reviewer.name}</div>
                                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-60">{s.reviewer.emp_id}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-200">
                                                        <div className="w-8 h-1 bg-slate-100 rounded-full" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end">
                                                    {s.status === 'REJECTED' ? (
                                                        <button
                                                            onClick={() => handleViewDetails(s.id, true)}
                                                            disabled={detailsLoading}
                                                            className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 group/btn"
                                                            title="Strategic Resubmission"
                                                        >
                                                            <FiEdit3 size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleViewDetails(s.id)}
                                                            disabled={detailsLoading}
                                                            className="w-10 h-10 rounded-2xl bg-slate-50/50 text-slate-400 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-white hover:shadow-lg transition-all active:scale-95 group/btn"
                                                            style={{ boxShadow: '0 8px 24px -4px var(--theme-primary-border)' }}
                                                            title="Authorize Audit"
                                                        >
                                                            <FiEye size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* HIGH-FIDELITY PORTAL MODAL */}
            {selectedSheet && createPortal(
                <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10" onClick={() => setSelectedSheet(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`px-10 py-14 flex items-center justify-between ${isResubmitting ? 'bg-red-500' : 'bg-[var(--theme-primary)]'} text-white relative overflow-hidden`}>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                                    {isResubmitting ? <FiEdit3 size={28} /> : <FiCalendar size={28} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight leading-none mb-3">
                                        {isResubmitting ? "Registry Modification Protocol" : "Review Master Log"}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                            {selectedSheet?.status}
                                        </div>
                                        <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-3">
                                            <span>{selectedSheet?.project_name}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSheet(null)} className="relative z-10 w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-all hover:rotate-90 active:scale-90">
                                <FiX size={24} />
                            </button>

                            {/* Background decoration */}
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-10 nx-ts-scroll-common">
                            <div className="mb-10 p-8 bg-slate-50/50 rounded-[24px] border border-slate-100 flex flex-wrap items-center gap-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--theme-primary)] border border-slate-100">
                                        <FiClock size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Time Period</span>
                                        <span className="text-[15px] font-black text-slate-700">{selectedSheet?.start_date} to {selectedSheet?.end_date}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100">
                                        <FiActivity size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Effort</span>
                                        <span className="text-[15px] font-black text-slate-700">{selectedSheet?.total_hours}h Captured</span>
                                    </div>
                                </div>
                            </div>

                            {selectedSheet?.review_comments && (
                                <div className={`mb-10 p-8 rounded-[24px] flex gap-6 ${selectedSheet.status === 'REJECTED' ? 'bg-red-50/50 border border-red-100' : 'bg-emerald-50/50 border border-emerald-100'}`}>
                                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${selectedSheet.status === 'REJECTED' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'}`}>
                                        <FiMessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${selectedSheet.status === 'REJECTED' ? 'text-red-600' : 'text-emerald-600'}`}>Reviewer Commentary</h4>
                                        <p className={`text-[14px] font-bold leading-relaxed ${selectedSheet.status === 'REJECTED' ? 'text-red-900' : 'text-emerald-900'}`}>
                                            "{selectedSheet.review_comments}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-50">
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date Log</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Breakdown</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {selectedSheet?.days.map((day, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 transition-all duration-300">
                                                <td className="px-8 py-6">
                                                    <div className="text-[13px] font-black text-slate-700 group-hover:text-[var(--theme-primary)] transition-colors">{day.date}</div>
                                                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">D-{idx + 1} Captured</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {isResubmitting ? (
                                                        <input
                                                            className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-[13px] font-bold text-slate-700 focus:border-red-400 outline-none transition-all shadow-sm"
                                                            value={day.notes}
                                                            onChange={e => handleUpdateDay(idx, 'notes', e.target.value)}
                                                        />
                                                    ) : (
                                                        <span className="text-[13px] font-bold text-slate-600 leading-relaxed">{day.notes || <em className="text-slate-300">No telemetry provided</em>}</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {isResubmitting ? (
                                                        <input
                                                            className="w-[100px] h-12 bg-white border border-red-200 rounded-xl text-center text-[15px] font-black text-red-600 outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-lg shadow-red-50"
                                                            type="number"
                                                            step="0.5"
                                                            value={day.hours}
                                                            onChange={e => handleUpdateDay(idx, 'hours', parseFloat(e.target.value) || 0)}
                                                        />
                                                    ) : (
                                                        <div className="text-center font-black text-[14px] py-2 rounded-xl bg-slate-50 text-slate-700 group-hover:bg-[var(--theme-primary)] group-hover:text-white transition-all">
                                                            {day.hours}h
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-10 border-t border-slate-50 flex justify-end items-center gap-6 bg-slate-50/20">
                            <button
                                className="px-10 py-4 rounded-[24px] bg-white border border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                                onClick={() => setSelectedSheet(null)}
                            >
                                {isResubmitting ? "Abort Protocol" : "Close Audit"}
                            </button>
                            {isResubmitting && (
                                <button
                                    className="px-10 py-4 rounded-[24px] bg-red-500 text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                                    disabled={detailsLoading}
                                    onClick={handleConfirmResubmit}
                                >
                                    {detailsLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FiSend size={16} />}
                                    {detailsLoading ? 'Synchronizing Pipeline...' : 'Authorize Global Resubmission'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* ELITE REVIEWER PROFILE MODAL */}
            {selectedReviewer && createPortal(
                <div className="fixed inset-0 z-[100000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10" onClick={() => setSelectedReviewer(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-[320px] rounded-[32px] shadow-2xl relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Background */}
                        <div className="h-[120px] bg-gradient-to-br from-[var(--theme-primary)] to-indigo-900 relative">
                            <button onClick={() => setSelectedReviewer(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-sm">
                                <FiX size={16} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="px-8 pb-8 flex flex-col items-center text-center relative -mt-[48px]">
                            <div className="w-24 h-24 rounded-[32px] bg-white p-1.5 shadow-xl mb-5 relative z-10">
                                <div className="w-full h-full rounded-[24px] bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-50">
                                    {selectedReviewer.avatarUrl ? (
                                        <img src={selectedReviewer.avatarUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black text-slate-300">{selectedReviewer.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-[22px] font-black text-slate-800 tracking-tight leading-none mb-2">{selectedReviewer.name}</h3>
                            <p className="text-[10px] font-black text-[var(--theme-primary)] uppercase tracking-widest mb-6">{selectedReviewer.department}</p>

                            <div className="w-full p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100/50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</span>
                                <span className="text-[13px] font-black text-slate-700 tracking-tight">{selectedReviewer.emp_id}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TimesheetHistory;
