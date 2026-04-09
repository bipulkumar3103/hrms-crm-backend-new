import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiInfo, FiClock, FiLayers, FiMessageSquare, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ApprovalDashboard = ({ api }) => {
    const [pendingSheets, setPendingSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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
        } catch (err) {
            alert("Action failed: " + (err.response?.data?.message || "Unknown error"));
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400">Loading Enterprise Review Queue...</div>;

    return (
        <div className="nx-ts-animate">
            <div 
                className="nx-ts-card"
                style={{ 
                    background: 'white',
                    border: '1px solid #f1f5f9',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    padding: 0
                }}
            >
                <div
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-8 py-5 sm:py-6 gap-4 sm:gap-0"
                    style={{ 
                        backgroundColor: 'var(--theme-primary)',
                    }}
                >
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <FiCheck size={18} className="text-white sm:hidden" />
                            <FiCheck size={20} className="text-white hidden sm:block" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-white font-bold text-[14px] sm:text-[15px] tracking-tight leading-none truncate">Review & Approval Queue</div>
                            <div className="text-white/60 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.15em] mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">Global Synchronization Registry</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/20 self-stretch sm:self-auto justify-center">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/80">{pendingSheets.length} Pending Actions</span>
                    </div>
                </div>

                <div className="p-4 sm:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List Pane: Hidden on mobile if a sheet is selected to focus on review */}
                        <div className={`lg:col-span-2 space-y-4 ${selectedSheet ? 'hidden lg:block' : 'block'}`}>
                            {pendingSheets.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                                    <FiCheck size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="font-semibold text-sm">All clear! No pending timesheets to review.</p>
                                </div>
                            ) : (
                                pendingSheets.map(sheet => (
                                    <motion.div
                                        key={sheet.id}
                                        whileHover={{ x: 5 }}
                                        className={`p-6 rounded-2xl border transition-all cursor-pointer ${selectedSheet?.id === sheet.id ? 'border-[var(--theme-primary)] bg-[var(--theme-secondary)] px-8' : 'border-gray-100 hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]'}`}
                                        onClick={() => setSelectedSheet(sheet)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
                                                    <FiUser size={20} className={selectedSheet?.id === sheet.id ? 'text-[var(--theme-primary)]' : 'text-gray-400'} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 mb-0.5 text-[15px]">{sheet.employee_name}</h3>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sheet.project_is_active === false ? 'text-gray-400 line-through' : 'text-[var(--theme-primary)]'}`}>
                                                        {sheet.project_name} {sheet.project_is_active === false && '(DEACTIVATED)'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${selectedSheet?.id === sheet.id ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>Review Pending</span>
                                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest opacity-60">{sheet.start_date} → {sheet.end_date}</p>
                                            </div>
                                            <div className="sm:hidden text-right">
                                                <div className="w-2 h-2 rounded-full bg-amber-400 mx-auto mb-1"></div>
                                                <span className="text-[8px] font-bold uppercase text-amber-600">Pending</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Details Pane */}
                        <div className={`lg:col-span-1 ${!selectedSheet ? 'hidden lg:block' : 'block'}`}>
                            <AnimatePresence mode="wait">
                                {selectedSheet ? (
                                    <motion.div
                                        key={selectedSheet.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-6 rounded-2xl border border-[var(--theme-primary)] bg-white shadow-xl sticky top-4"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50">
                                                    <FiInfo size={14} className="text-indigo-600" />
                                                </div>
                                                <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">Verification Protocol</h3>
                                            </div>
                                            {/* Adaptive Back Button for Mobile */}
                                            <button 
                                                className="lg:hidden p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                                                onClick={() => setSelectedSheet(null)}
                                                title="Back to Queue"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4 space-y-4 mb-6 border border-gray-100">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-semibold tracking-tight text-[11px] uppercase opacity-60">Total Hours Logged</span>
                                                <span className="text-lg font-bold text-gray-800">{selectedSheet.total_hours}h</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-semibold tracking-tight text-[11px] uppercase opacity-60">Reporting Period</span>
                                                <span className="font-bold text-gray-700 text-xs">{selectedSheet.start_date}</span>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-2 tracking-widest px-1">Approver Feedback / Notes</label>
                                            <textarea
                                                className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm font-semibold text-gray-600 placeholder-gray-300 focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/10 transition-all outline-none resize-none min-h-[120px]"
                                                placeholder="Add context for approval or rejection reasons..."
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => handleAction(selectedSheet.id, 'REJECTED')}
                                                className="flex items-center justify-center gap-2 py-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                <FiX size={14} /> Reject
                                            </button>
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => handleAction(selectedSheet.id, 'APPROVED')}
                                                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                <FiCheck size={14} /> {isProcessing ? 'Wait...' : 'Approve'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="p-12 border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl text-center text-gray-400">
                                        <FiMessageSquare size={40} className="mx-auto mb-4 opacity-10" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Select an item to verify</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalDashboard;
