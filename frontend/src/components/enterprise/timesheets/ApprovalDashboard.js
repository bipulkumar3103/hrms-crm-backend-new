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
            <h2 className="text-xl font-bold mb-6 text-gray-800">Review & Approval Queue</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Pane */}
                <div className="lg:col-span-2 space-y-4">
                    {pendingSheets.length === 0 ? (
                        <div className="nx-ts-card text-center py-12 text-gray-400 border-dashed">
                            <FiCheck size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="font-medium">All clear! No pending timesheets to review.</p>
                        </div>
                    ) : (
                        pendingSheets.map(sheet => (
                            <div
                                key={sheet.id}
                                className={`nx-ts-card cursor-pointer transition-all ${selectedSheet?.id === sheet.id ? 'ring-2 ring-[var(--theme-primary)] nx-ts-bg-soft' : 'hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)]'}`}
                                onClick={() => setSelectedSheet(sheet)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl nx-ts-bg-soft flex items-center justify-center nx-ts-text-primary">
                                            <FiLayers size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-0">{sheet.employee_name}</h3>
                                            <p className={`text-xs font-bold uppercase tracking-wider ${sheet.project_is_active === false ? 'text-gray-400 line-through' : 'nx-ts-text-primary'}`}>
                                                {sheet.project_name} {sheet.project_is_active === false && '(DEACTIVATED)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="nx-ts-badge nx-ts-badge-pending">Review Pending</span>
                                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{sheet.start_date} → {sheet.end_date}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Details Pane */}
                <div className="lg:col-span-1">
                    <AnimatePresence mode="wait">
                        {selectedSheet ? (
                            <motion.div
                                key={selectedSheet.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="nx-ts-card sticky top-4 border-t-4 border-t-[var(--nx-ts-primary)]"
                            >
                                <h3 className="text-lg font-bold mb-6 text-gray-800">Submission Details</h3>

                                <div className="bg-gray-50 rounded-xl p-4 space-y-4 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Total Logged Hours</span>
                                        <span className="text-lg font-black text-gray-800">{selectedSheet.total_hours}h</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Period Span</span>
                                        <span className="font-bold text-gray-700">{selectedSheet.start_date}</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Approver Feedback / Notes</label>
                                    <textarea
                                        className="nx-ts-input min-h-[120px] text-sm resize-none"
                                        placeholder="Add context for approval or rejection reasons..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => handleAction(selectedSheet.id, 'REJECTED')}
                                        className="nx-ts-nav-btn border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold py-3 flex items-center justify-center gap-2"
                                    >
                                        <FiX /> Reject
                                    </button>
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => handleAction(selectedSheet.id, 'APPROVED')}
                                        className="nx-ts-btn-primary flex items-center justify-center gap-2 py-3"
                                    >
                                        <FiCheck /> {isProcessing ? 'Wait...' : 'Approve'}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="nx-ts-card border-dashed bg-gray-50/50 text-center py-20 text-gray-400">
                                <FiMessageSquare size={40} className="mx-auto mb-4 opacity-10" />
                                <p className="text-xs font-bold uppercase tracking-widest">Select an item to review</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ApprovalDashboard;
