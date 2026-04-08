import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiArrowRight, FiEye, FiX, FiEdit3, FiSend } from 'react-icons/fi';

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
        <div className="nx-ts-animate">
            <div className="nx-ts-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="m-0">My Submission History</h2>
                    <span className="text-sm text-gray-400 font-medium">{submissions.length} Total Submissions</span>
                </div>

                {submissions.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCalendar size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500">You haven't submitted any timesheets yet.</p>
                    </div>
                ) : (
                    <div
                        className="nx-ts-excel-wrap nx-ts-scrollable-modal nx-ts-scroll-common"
                        style={{ maxHeight: '400px', overflowY: 'auto', display: 'block' }}
                    >
                        <table className="nx-ts-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '180px' }}>Period</th>
                                    <th>Project</th>
                                    <th style={{ width: '100px' }}>Hours</th>
                                    <th style={{ width: '120px' }}>Status</th>
                                    <th style={{ width: '80px' }}>Action</th>
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
                                                {s.project_name} {s.project_is_active === false && <span className="text-[9px] ml-1 uppercase font-black tracking-widest opacity-50">(DEACTIVATED)</span>}
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
                )}
            </div>

            {/* PORTAL MODAL */}
            {createPortal(
                <div className={`nx-modal-bg ${selectedSheet ? 'open' : ''}`} onClick={() => setSelectedSheet(null)}>
                    <div className="nx-modal nx-modal-wide" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6 border-b pb-4">
                            <div>
                                <h3 className="m-0 text-xl font-extrabold flex items-center gap-3">
                                    {isResubmitting ? <FiEdit3 className="text-red-500" /> : <FiCalendar style={{ color: 'var(--theme-primary)' }} />}
                                    {isResubmitting ? "Fix & Resubmit" : "Detailed Review"}: {selectedSheet?.project_name}
                                </h3>
                                <p className="m-0 mt-1 text-sm text-gray-500">
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
