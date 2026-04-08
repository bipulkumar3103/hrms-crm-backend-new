import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../utils/api';
import {
    FiSend, FiClock, FiCheckCircle, FiAlertCircle,
    FiTrash2, FiUpload, FiChevronDown, FiSearch, FiFolder,
    FiCalendar, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import EliteSelector from '../../common/EliteSelector';
import EliteDatePicker from '../../common/EliteDatePicker';
import * as XLSX from 'xlsx';

const TimesheetConsole = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        project_id: '',
        start_date: '',
        end_date: '',
        days: []
    });
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        api.get('/timesheets/my-projects')
            .then(res => setProjects(res.data))
            .catch(err => console.error("Failed to load projects", err));
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                setMessage("Error: The selected file appears to be empty.");
                return;
            }

            // Map columns from Excel
            const mappedDays = data.map(row => ({
                date: row['Date'] || row['date'] || '',
                hours: parseFloat(row['Hours Worked'] || row['hours'] || 0),
                notes: row['Task Description'] || row['notes'] || row['Task'] || ''
            })).filter(day => day.date);

            if (mappedDays.length === 0) {
                setMessage("Error: Could not find valid dates in the Excel file. Please use 'Date' column.");
                return;
            }

            // Set range based on imported data
            const dates = mappedDays.map(d => new Date(d.date)).sort((a, b) => a - b);
            const start = dates[0].toISOString().split('T')[0];
            const end = dates[dates.length - 1].toISOString().split('T')[0];

            setFormData({
                ...formData,
                start_date: start,
                end_date: end,
                days: mappedDays
            });
            setMessage("✓ Excel data imported! Please review and select a project.");
        };
        reader.readAsBinaryString(file);
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        if (newFormData.start_date && newFormData.end_date) {
            const start = new Date(newFormData.start_date);
            const end = new Date(newFormData.end_date);
            const diffMs = end - start;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays > 31) {
                setMessage("Error: Timesheet span cannot exceed 31 days.");
                setFormData(newFormData);
                return;
            }
            if (diffDays <= 0) {
                setMessage("Error: Invalid date range.");
                setFormData(newFormData);
                return;
            }

            const days = [];
            for (let i = 0; i < diffDays; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                days.push({
                    date: date.toISOString().split('T')[0],
                    hours: 8,
                    notes: ''
                });
            }
            newFormData.days = days;
            setMessage('');
        }
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/timesheets/submit', formData);
            setMessage("✓ Timesheet submitted for approval!");
            setFormData({ project_id: '', start_date: '', end_date: '', days: [] });
        } catch (err) {
            setMessage("Error: Submission failed. " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateDay = (idx, field, value) => {
        const newDays = [...formData.days];
        newDays[idx][field] = value;
        setFormData({ ...formData, days: newDays });
    };

    return (
        <div className="nx-ts-animate">
            <div className="nx-ts-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="m-0 text-xl font-bold text-gray-800">Submit New Timesheet</h2>
                    <div className="flex gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="nx-ts-upload-hidden"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                        />
                        <button
                            type="button"
                            className="nx-ts-btn-ghost px-4 py-2 border rounded-xl flex items-center gap-2 text-sm font-bold transition-all hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)]"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <FiUpload /> Import Excel
                        </button>
                        {formData.days.length > 0 && (
                            <button
                                type="button"
                                className="nx-ts-btn-ghost text-red-500 border-red-100 hover:bg-red-50 px-4 py-2 border rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
                                onClick={() => setFormData({ project_id: '', start_date: '', end_date: '', days: [] })}
                            >
                                <FiTrash2 /> Clear All
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="nx-ts-form-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1.5fr 1fr 1fr', 
                        gap: '1.25rem',
                        alignItems: 'end'
                    }}>
                        <div className="nx-ts-form-group">
                            <EliteSelector
                                label="Assigned Project"
                                placeholder="Select Active Project"
                                options={projects}
                                value={formData.project_id}
                                onChange={(id) => setFormData({ ...formData, project_id: id })}
                                icon={FiFolder}
                            />
                        </div>
                        <div className="nx-ts-form-group">
                            <EliteDatePicker 
                                label="Protocol Start"
                                value={formData.start_date}
                                onChange={(date) => handleDateChange({ target: { name: 'start_date', value: date } })}
                            />
                        </div>
                        <div className="nx-ts-form-group">
                            <EliteDatePicker 
                                label="Protocol End"
                                value={formData.end_date}
                                onChange={(date) => handleDateChange({ target: { name: 'end_date', value: date } })}
                            />
                        </div>
                    </div>

                    {formData.days.length > 0 && !message.startsWith('Error') && (
                        <div className="mt-8">
                            <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <FiClock size={14} /> Timesheet Preview & Edit
                            </h3>
                            <div
                                className="nx-ts-excel-wrap nx-ts-scrollable-console nx-ts-scroll-common"
                                style={{ maxHeight: '450px', overflowY: 'auto', display: 'block' }}
                            >
                                <table className="nx-ts-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '150px' }}>Date</th>
                                            <th>Task Description</th>
                                            <th style={{ width: '120px' }}>Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.days.map((day, idx) => (
                                            <tr key={idx}>
                                                <td className="font-bold text-gray-600">{day.date}</td>
                                                <td>
                                                    <input
                                                        className="nx-ts-grid-input"
                                                        value={day.notes || ''}
                                                        placeholder="What did you work on?"
                                                        onChange={e => updateDay(idx, 'notes', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        className="nx-ts-grid-input text-center font-extrabold"
                                                        style={{ color: 'var(--theme-primary)' }}
                                                        type="number"
                                                        step="0.5"
                                                        value={day.hours}
                                                        onChange={e => updateDay(idx, 'hours', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className={`mt-6 nx-ts-msg ${message.startsWith('Error') ? 'err' : 'sub'} flex items-center gap-3`}>
                            {message.startsWith('Error') ? <FiAlertCircle /> : <FiCheckCircle />}
                            {message}
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            className={`flex items-center gap-3 transition-all ${(!formData.project_id || formData.days.length === 0 || message.startsWith('Error')) ? 'cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.02] shadow-lg'}`}
                            style={{ 
                                height: '52px', 
                                padding: '0 2.5rem', 
                                borderRadius: '14px',
                                textTransform: 'uppercase',
                                fontSize: '12px',
                                fontWeight: '900',
                                letterSpacing: '0.05em',
                                backgroundColor: (!formData.project_id || formData.days.length === 0 || message.startsWith('Error')) ? 'var(--theme-bg, #f1f5f9)' : 'var(--theme-primary)',
                                color: (!formData.project_id || formData.days.length === 0 || message.startsWith('Error')) ? '#94a3b8' : '#ffffff',
                                border: (!formData.project_id || formData.days.length === 0 || message.startsWith('Error')) ? '1px solid #e2e8f0' : 'none'
                            }}
                            disabled={isSubmitting || !formData.project_id || formData.days.length === 0 || message.startsWith('Error')}
                        >
                            {isSubmitting ? 'Processing...' : (
                                <>
                                    <FiSend size={16} /> PUSH TO REVIEW QUEUE
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TimesheetConsole;
