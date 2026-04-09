import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiArrowRight, FiEye, FiX, FiEdit3, FiSend, FiList, FiAlertCircle } from 'react-icons/fi';

import { createPortal } from 'react-dom';

const TimesheetHistory = ({ user }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);
    const [resubmitMessage, setResubmitMessage] = useState('');

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
                console.error("Failed to load submission history", err);
                setLoading(false);
            });
    };

    const handleViewDetails = (id, forceEdit = false) => {
        setDetailsLoading(true);
        setResubmitMessage('');
        api.get(`/timesheets/details/${id}`)
            .then(res => {
                setSelectedSheet(res.data);
                setIsResubmitting(forceEdit || res.data.status === 'REJECTED');
                setDetailsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load details", err);
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
            setResubmitMessage("✓ Resubmitted successfully!");
            setTimeout(() => {
                setSelectedSheet(null);
                loadSubmissions();
            }, 1500);
        } catch (err) {
            setResubmitMessage("Error: " + (err.response?.data?.message || err.message));
        } finally {
            setDetailsLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="nx-ts-badge nx-ts-badge-approved">Approved</span>;
            case 'REJECTED':
                return <span className="nx-ts-badge nx-ts-badge-rejected">Rejected</span>;
            case 'PENDING':
                return <span className="nx-ts-badge nx-ts-badge-pending">Pending</span>;
            default:
                return <span className="nx-ts-badge">{status}</span>;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return <FiCheckCircle className="text-green-500" />;
            case 'REJECTED': return <FiXCircle className="text-red-500" />;
            default: return <FiClock className="text-amber-500" />;
        }
    };

    if (loading) return <div className="nx-ts-msg sub">Loading your history...</div>;

    return (
        <div className="nx-ts-animate">            <div
            className="nx-ts-card overflow-hidden"
            style={{
                background: 'white',
                border: '1px solid #f1f5f9',
                borderRadius: '24px',
                boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
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
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                        <FiList size={20} className="text-white" />
                    </div>
                    <div>
                        <div className="text-white font-bold text-base sm:text-lg tracking-tight leading-none">My Submission History</div>
                        <div className="text-white/60 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] mt-1.5">Chronological Records Logging</div>
                    </div>
                </div>
                <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-md self-stretch sm:self-auto flex items-center justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white whitespace-nowrap">{submissions.length} Total Logs</span>
                </div>
            </div>


            <div className="p-8">

                {submissions.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCalendar size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500">You haven't submitted any timesheets yet.</p>
                    </div>
                ) : (
                    <div className="nx-ts-excel-wrap nx-ts-scrollable-modal nx-ts-scroll-common">
                        {/* Desktop Table: Hidden on Mobile */}
                        <div className="hidden md:block">
                            <table className="nx-ts-table">
                                <thead>
                                    <tr className="bg-[#f8fafc]">
                                        <th style={{ width: '180px' }}>Period Span</th>
                                        <th>Project Identifier</th>
                                        <th className="text-center" style={{ width: '100px' }}>Hrs</th>
                                        <th style={{ width: '120px' }}>Status</th>
                                        <th className="text-right" style={{ width: '80px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((s) => (
                                        <tr key={s.id} className="hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-colors">
                                            <td className="font-bold text-gray-700" data-label="Range">
                                                <div className="flex items-center gap-1">
                                                    {s.start_date} <FiArrowRight size={10} className="text-gray-300" /> {s.end_date}
                                                </div>
                                            </td>
                                            <td data-label="Project">
                                                <div
                                                    className={`font-bold text-sm sm:text-base ${s.project_is_active === false ? 'text-gray-400 line-through' : ''}`}
                                                    style={{ color: s.project_is_active === false ? '#94a3b8' : 'var(--theme-primary)' }}
                                                >
                                                    {s.project_name} {s.project_is_active === false && <span className="text-[9px] ml-1 uppercase font-bold tracking-widest opacity-50">(DEACTIVATED)</span>}
                                                </div>
                                            </td>
                                            <td className="text-center" data-label="Hours">
                                                <span className="font-bold text-gray-800">{s.total_hours}h</span>
                                            </td>
                                            <td data-label="Status">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(s.status)}
                                                </div>
                                            </td>
                                            <td className="text-right" data-label="Action">
                                                <div className="flex gap-2 justify-end">
                                                    {s.status === 'REJECTED' ? (
                                                        <button
                                                            onClick={() => handleViewDetails(s.id, true)}
                                                            disabled={detailsLoading}
                                                            className="nx-ts-btn-ghost !p-2 border-red-100 text-red-500 hover:bg-red-50"
                                                            title="Fix & Resubmit"
                                                        >
                                                            <FiEdit3 size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleViewDetails(s.id)}
                                                            disabled={detailsLoading}
                                                            className="nx-ts-btn-ghost !p-2 border-transparent hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)]"
                                                            title="View Daily Log"
                                                        >
                                                            <FiEye size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-gray-50 bg-gray-50/20">
                            {submissions.map((s) => (
                                <div key={s.id} className="p-6 transition-all active:bg-gray-100 hover:bg-gray-50/80">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Date Range Protocol</div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                {s.start_date} <FiArrowRight size={10} className="text-gray-300" /> {s.end_date}
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Yielded Hours</div>
                                            <div className="text-lg font-bold text-indigo-600 leading-none">{s.total_hours}h</div>
                                        </div>
                                    </div>

                                    <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm ring-4 ring-gray-100/50">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Authenticated Project Identifier</div>
                                        <div
                                            className={`font-bold text-[13px] leading-tight ${s.project_is_active === false ? 'text-gray-400 line-through' : 'text-gray-900 font-bold'}`}
                                        >
                                            {s.project_name}
                                        </div>
                                        {s.project_is_active === false && (
                                            <div className="flex items-center gap-1.5 mt-2 text-[8px] uppercase font-bold tracking-widest text-amber-500">
                                                <FiAlertCircle size={10} /> Decommissioned Project
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center gap-4">
                                        <div className="shrink-0">
                                            {getStatusBadge(s.status)}
                                        </div>
                                        <div className="flex-1 flex justify-end">
                                            {s.status === 'REJECTED' ? (
                                                <button
                                                    onClick={() => handleViewDetails(s.id, true)}
                                                    disabled={detailsLoading}
                                                    className="flex items-center justify-center gap-2 w-full max-w-[140px] py-3 rounded-xl bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 transition-all"
                                                >
                                                    <FiEdit3 size={14} /> Fix Entry
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleViewDetails(s.id)}
                                                    disabled={detailsLoading}
                                                    className="flex items-center justify-center gap-2 w-full max-w-[140px] py-3 rounded-xl bg-white text-indigo-600 text-[10px] font-bold uppercase tracking-widest border border-indigo-100 shadow-sm active:bg-gray-50 transition-all"
                                                >
                                                    <FiEye size={14} /> View Logs
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

            {/* PORTAL MODAL */}
            {createPortal(
                <div className={`nx-modal-bg ${selectedSheet ? 'open' : ''}`} onClick={() => setSelectedSheet(null)}>
                    <div className="nx-modal nx-modal-wide" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6 border-b pb-4">
                            <div>
                                <h3 className="m-0 text-lg font-bold flex items-center gap-3">
                                    {isResubmitting ? <FiEdit3 className="text-red-500" /> : <FiCalendar style={{ color: 'var(--theme-primary)' }} />}
                                    {isResubmitting ? "Fix & Resubmit" : "Detailed Review"}: {selectedSheet?.project_name}
                                </h3>
                                <p className="m-0 mt-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                                    {selectedSheet?.start_date} to {selectedSheet?.end_date} • {selectedSheet?.status}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSheet(null)}
                                className="p-2 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-full transition-colors text-gray-400 hover:text-gray-900"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <div
                            className="nx-ts-excel-wrap nx-ts-scrollable-modal nx-ts-scroll-common"
                            style={{ maxHeight: '500px', overflowY: 'auto', display: 'block' }}
                        >
                            <table className="nx-ts-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '150px' }}>Date</th>
                                        <th>Work Description</th>
                                        <th style={{ width: '120px' }} className="text-center">Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSheet?.days.map((day, idx) => (
                                        <tr key={idx}>
                                            <td className="font-bold text-gray-600" data-label="Date">{day.date}</td>
                                            <td data-label="Work Description">
                                                {isResubmitting ? (
                                                    <input
                                                        className="nx-ts-grid-input"
                                                        value={day.notes}
                                                        onChange={e => handleUpdateDay(idx, 'notes', e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="text-gray-700">{day.notes || <em className="text-gray-300">No description</em>}</span>
                                                )}
                                            </td>
                                            <td data-label="Hours">
                                                {isResubmitting ? (
                                                    <input
                                                        className="nx-ts-grid-input text-center font-bold text-red-600"
                                                        type="number"
                                                        step="0.5"
                                                        value={day.hours}
                                                        onChange={e => handleUpdateDay(idx, 'hours', parseFloat(e.target.value) || 0)}
                                                    />
                                                ) : (
                                                    <div
                                                        className="text-center font-bold py-1 rounded"
                                                        style={{
                                                            color: 'var(--theme-primary)',
                                                            backgroundColor: 'rgba(43, 182, 203, 0.08)' /* Tint of theme-primary */
                                                        }}
                                                    >
                                                        {day.hours}h
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {resubmitMessage && (
                            <div className={`mt-4 nx-ts-msg ${resubmitMessage.startsWith('✓') ? 'sub' : 'err'}`}>
                                {resubmitMessage}
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                            <button
                                className="nx-m-cancel !w-auto !px-8"
                                onClick={() => setSelectedSheet(null)}
                            >
                                {isResubmitting ? "Cancel" : "Close Review"}
                            </button>
                            {isResubmitting && (
                                <button
                                    className="nx-m-send !w-auto !px-8"
                                    disabled={detailsLoading}
                                    onClick={handleConfirmResubmit}
                                >
                                    <FiSend /> {detailsLoading ? 'Sending...' : 'Confirm Resubmission'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


export default TimesheetHistory;
