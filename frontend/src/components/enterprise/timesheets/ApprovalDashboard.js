import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiInfo, FiClock, FiLayers, FiMessageSquare, FiUser, FiActivity, FiShield, FiAlertTriangle, FiCheckSquare } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../../../context/AlertContext';

const ApprovalDashboard = ({ api }) => {
    const { showAlert } = useAlert();
    const [pendingSheets, setPendingSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatSpanDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/timesheets/review-queue');
            setPendingSheets(res.data);
        } catch (err) {
            console.error("Failed to fetch approvals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        setIsProcessing(true);
        try {
            await api.post('/timesheets/action', {
                timesheet_id: id,
                action: action.toUpperCase(),
                comments: feedback
            });
            await fetchPending();
            setSelectedSheet(null);
            setFeedback('');
            showAlert(`Protocolized validation: Entry ${action.toLowerCase()}.`, "success");
        } catch (err) {
            showAlert("Action failure: " + (err.response?.data?.message || "Unknown error"), "error");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Synchronizing Review Queue...</div>;

    return (
        <div className="nx-ts-animate w-full flex flex-col gap-6 pb-12">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
            >
                {/* Hub Identity Header */}
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--theme-primary)] border border-slate-100">
                            <FiCheckSquare size={22} />
                        </div>
                        <div>
                            <div className="text-slate-800 font-black text-base tracking-tight leading-none uppercase">Master Authorization Queue</div>
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                <span className="text-[var(--theme-primary)]">{pendingSheets.length}</span> Active Validation Protocol{pendingSheets.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--theme-primary)] shadow-[0_0_10px_rgba(var(--theme-primary-rgb),0.3)] animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Queue State: {pendingSheets.length > 5 ? 'High Density' : 'Optimized'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-[500px]">
                        {/* LIST COLUMN (Verification Hub) */}
                        <div className={`lg:col-span-7 flex flex-col gap-5 ${selectedSheet ? 'hidden lg:flex' : 'flex'}`}>
                            {pendingSheets.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-100 rounded-[32px] bg-slate-50/20">
                                    <div className="w-20 h-20 rounded-[32px] bg-white shadow-sm flex items-center justify-center mb-8 text-slate-50 border border-slate-100">
                                        <FiLayers size={40} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3">Gateway Synchronized</h3>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest max-w-[240px] leading-relaxed">No outstanding resource protocols require manual validation.</p>
                                </div>
                            ) : (
                                pendingSheets.map(sheet => (
                                    <motion.div
                                        key={sheet.id}
                                        whileHover={{ x: 5 }}
                                        className={`p-6 rounded-[24px] border transition-all cursor-pointer group relative overflow-hidden ${selectedSheet?.id === sheet.id ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/[0.03] shadow-xl shadow-indigo-100' : 'border-slate-50 hover:border-[var(--theme-primary)]/20 hover:bg-slate-50/50'}`}
                                        onClick={() => setSelectedSheet(sheet)}
                                    >
                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 ${selectedSheet?.id === sheet.id ? 'bg-[var(--theme-primary)] text-white border-transparent shadow-2xl shadow-indigo-200' : 'bg-white text-slate-300 border-slate-100 group-hover:border-[var(--theme-primary)]/20 group-hover:bg-slate-50'}`}>
                                                    <FiUser size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`font-black text-lg tracking-tight transition-colors ${selectedSheet?.id === sheet.id ? 'text-[var(--theme-primary)]' : 'text-slate-800'}`}>{sheet.employee_name}</h3>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${sheet.project_is_active === false ? 'text-slate-200 line-through' : 'text-slate-400'}`}>
                                                            {sheet.project_name}
                                                        </span>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedSheet?.id === sheet.id ? 'text-[var(--theme-primary)]' : 'text-slate-700'}`}>{sheet.total_hours}h Metrics</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex flex-col items-end gap-3">
                                                <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedSheet?.id === sheet.id ? 'bg-[var(--theme-primary)] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    Pending Authorization
                                                </div>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] opacity-80 leading-none">{formatSpanDate(sheet.start_date)} — {formatSpanDate(sheet.end_date)}</p>
                                            </div>
                                        </div>
                                        {selectedSheet?.id === sheet.id && (
                                            <motion.div 
                                                layoutId="activeQueueIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[var(--theme-primary)] rounded-r-full"
                                            />
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className={`lg:col-span-5 ${!selectedSheet ? 'hidden lg:block' : 'block'}`}>
                            <AnimatePresence mode="wait">
                                {selectedSheet ? (
                                    <motion.div
                                        key={selectedSheet.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-10 rounded-[32px] border border-slate-100 bg-white shadow-2xl sticky top-4 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-12">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[20px] flex items-center justify-center bg-[var(--theme-primary)] shadow-xl shadow-indigo-100 text-white border border-white/20">
                                                    <FiShield size={22} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Verification Engine</h3>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Audit Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                className="lg:hidden w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                                                onClick={() => setSelectedSheet(null)}
                                            >
                                                <FiX size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 mb-10">
                                            <div className="p-6 bg-slate-50/50 rounded-[20px] border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Logged Effort</span>
                                                <span className="text-2xl font-black text-slate-800 tracking-tight">{selectedSheet.total_hours}h <span className="text-xs text-slate-300 font-bold ml-1">Payload</span></span>
                                            </div>
                                            <div className="p-6 bg-slate-50/50 rounded-[20px] border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Temporal Span</span>
                                                <div className="text-[14px] font-black text-slate-800 tracking-tight leading-none uppercase">
                                                    {formatSpanDate(selectedSheet.start_date)} — {formatSpanDate(selectedSheet.end_date)} 
                                                </div>
                                            </div>
                                        </div>

                                        {selectedSheet.project_is_active === false && (
                                            <div className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4 shadow-sm shadow-amber-50">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                                                    <FiAlertTriangle size={18} />
                                                </div>
                                                <p className="text-[10px] font-black text-amber-700 uppercase leading-relaxed tracking-widest">
                                                    Security Alert: This project has been Decommissioned. Validating stale resource data requires senior authorization.
                                                </p>
                                            </div>
                                        )}

                                        <div className="mb-12">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] px-1">Verification Commentary</label>
                                            <textarea
                                                className="w-full bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 text-[14px] font-bold text-slate-600 placeholder-slate-300 focus:bg-white focus:border-[var(--theme-primary)] focus:ring-8 focus:ring-[var(--theme-primary)]/5 transition-all outline-none resize-none min-h-[200px] shadow-inner"
                                                placeholder="Provide rationalization for the review decision..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => handleAction(selectedSheet.id, 'APPROVED')}
                                                className="w-full flex items-center justify-center gap-4 py-5 rounded-[20px] bg-[var(--theme-primary)] text-white shadow-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95"
                                                style={{ boxShadow: '0 20px 40px -10px var(--theme-primary-border)' }}
                                            >
                                                {isProcessing ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FiCheck size={18} />}
                                                {isProcessing ? 'Validating Metadata...' : 'Authorize Payload'}
                                            </button>
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => handleAction(selectedSheet.id, 'REJECTED')}
                                                className="w-full flex items-center justify-center gap-3 py-4 rounded-[20px] border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                <FiX size={16} /> Deny Synchronization
                                            </button>
                                        </div>

                                        {/* Background decoration */}
                                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[var(--theme-primary)] opacity-[0.02] rounded-full blur-3xl"></div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 border border-dashed border-slate-100 bg-slate-50/10 rounded-[40px] text-center">
                                        <div className="w-24 h-24 rounded-[32px] bg-white shadow-sm flex items-center justify-center mb-8 text-slate-50 border border-slate-100">
                                            <FiMessageSquare size={40} />
                                        </div>
                                        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-300">Verification Protocol Required</h3>
                                        <p className="text-[10px] font-bold text-slate-200 uppercase tracking-widest mt-3 max-w-[200px] leading-relaxed">Select a node from the registry to initialize the manual audit.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ApprovalDashboard;
