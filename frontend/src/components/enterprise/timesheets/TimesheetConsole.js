import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../utils/api';
import {
    FiSend, FiClock, FiCheckCircle, FiAlertCircle,
    FiTrash2, FiUpload, FiChevronDown, FiSearch, FiFolder,
    FiCalendar, FiChevronLeft, FiChevronRight, FiX
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
    const [focusedRow, setFocusedRow] = useState(null);
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
        <div className="nx-ts-animate w-full">
            {/* Unified Administrative Toolkit Structure */}
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
                {/* Section Header — Company Theme Sync */}
                <div
                    className="flex items-center justify-between px-4 sm:px-8 py-5 sm:py-6"
                    style={{ 
                        backgroundColor: 'var(--theme-primary)',
                        borderRadius: '24px 24px 0 0'
                    }}
                >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <FiClock size={16} className="sm:hidden text-white" />
                            <FiClock size={18} className="hidden sm:block text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-white font-bold text-sm sm:text-[15px] tracking-tight leading-none truncate">Submit New Timesheet</div>
                            <div className="text-white/60 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.15em] mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Primary Entry & Validation Protocol</div>
                        </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3 shrink-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                        />
                        <button
                            type="button"
                            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95"
                            onClick={() => fileInputRef.current.click()}
                            title="Import Protocol"
                        >
                            <FiUpload size={14} className="shrink-0" />
                            <span className="hidden xs:inline">Import Protocol</span>
                            <span className="xs:hidden">Import</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Two-Panel Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100" style={{ borderRadius: '0 0 24px 24px', overflow: 'visible' }}>
                        
                        {/* Panel 1: Protocol Configuration */}
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-secondary, #ede9fe)' }}>
                                    <FiFolder size={13} style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--theme-primary)' }}>Instance Configuration</h3>
                            </div>

                            <EliteSelector
                                label="Target Identifier / Project"
                                placeholder="Select Active Project"
                                options={projects}
                                value={formData.project_id}
                                onChange={(id) => setFormData({ ...formData, project_id: id })}
                                icon={FiFolder}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <EliteDatePicker 
                                    label="Protocol Start"
                                    value={formData.start_date}
                                    onChange={(date) => handleDateChange({ target: { name: 'start_date', value: date } })}
                                />
                                <EliteDatePicker 
                                    label="Protocol End"
                                    value={formData.end_date}
                                    onChange={(date) => handleDateChange({ target: { name: 'end_date', value: date } })}
                                />
                            </div>
                        </div>

                        {/* Panel 2: Secondary Logic & Submission */}
                        <div className={`p-6 sm:p-8 flex flex-col ${formData.days.length > 0 ? 'justify-start' : 'justify-between'}`}>
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-secondary, #ede9fe)' }}>
                                        <FiSend size={13} style={{ color: 'var(--theme-primary)' }} />
                                    </div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--theme-primary)' }}>Submission Gateway</h3>
                                </div>

                                {formData.days.length === 0 ? (
                                    <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                        <FiClock className="mx-auto mb-3 text-gray-300" size={32} />
                                        <p className="text-sm font-semibold text-gray-400 italic">Configure a date range or import a protocol to begin entry.</p>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-[var(--theme-secondary)] rounded-2xl border border-[var(--theme-primary)]/20 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--theme-primary)]">
                                            <span>Active Duration</span>
                                            <span className="bg-white px-2 py-0.5 rounded-md shadow-sm">{formData.days.length} Days</span>
                                        </div>
                                        <div className="text-gray-500 text-xs font-semibold italic">Protocol generated. Please verify entries below before synchronization.</div>
                                        
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-red-500 border border-red-100 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all mt-4"
                                            onClick={() => setFormData({ project_id: '', start_date: '', end_date: '', days: [] })}
                                        >
                                            <FiTrash2 size={12} /> Clear Registry Entry
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.project_id || formData.days.length === 0 || message.startsWith('Error')}
                                    className="w-full flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-200"
                                    style={{
                                        height: '52px', borderRadius: '14px', border: 'none',
                                        backgroundColor: (!formData.project_id || formData.days.length === 0 || message.startsWith('Error')) ? '#f1f5f9' : 'var(--theme-primary)',
                                        color: (!formData.project_id || formData.days.length === 0 || message.startsWith('Error')) ? '#94a3b8' : '#ffffff',
                                        cursor: (!formData.project_id || formData.days.length === 0 || message.startsWith('Error')) ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.75 : 1,
                                    }}
                                >
                                    {isSubmitting
                                        ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> <span className="hidden xs:inline">Transmitting...</span><span className="xs:hidden">Pushing...</span></>
                                        : <><FiSend size={14} /><span className="hidden xs:inline">Push to Review Queue</span><span className="xs:hidden">Send Protocol</span></>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>

            {/* Preview Section - Aligned with Project Registry List Style */}
            <AnimatePresence>
                {formData.days.length > 0 && !message.startsWith('Error') && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="mt-8"
                    >
                        <div 
                            className="bg-white rounded-[24px] border border-[#f1f5f9] shadow-sm overflow-hidden"
                        >
                            <div
                                className="flex items-center justify-between px-8 py-5"
                                style={{ 
                                    backgroundColor: 'var(--theme-primary)',
                                }}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                        <FiClock size={16} className="sm:hidden text-white" />
                                        <FiClock size={18} className="hidden sm:block text-white" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm sm:text-[15px] tracking-tight leading-none">Entry Preview & Metadata Logging</div>
                                        <div className="text-white/60 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.15em] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Real-time Protocol Verification</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{formData.days.length} Active Records</span>
                                </div>
                            </div>

                            {/* Desktop Table: Hidden on Mobile */}
                            <div className="hidden md:block overflow-x-auto nx-ts-scrollable-console nx-ts-scroll-common" style={{ maxHeight: '500px' }}>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] w-[180px]">Chronology</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Entry Definition / Task Details</th>
                                            <th className="px-8 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] w-[120px]">Quantum (Hrs)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.days.map((day, idx) => (
                                            <tr 
                                                key={idx} 
                                                className={`transition-all duration-200 ${focusedRow === idx ? 'bg-[var(--theme-primary)] text-white shadow-lg' : 'hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)]'}`}
                                            >
                                                <td className="px-8 py-4">
                                                    <div className={`text-sm font-bold ${focusedRow === idx ? 'text-white' : 'text-gray-700'}`}>{day.date}</div>
                                                    <div className={`text-[10px] font-semibold uppercase tracking-tighter mt-0.5 ${focusedRow === idx ? 'text-white/70' : 'text-gray-400'}`}>Active Protocol</div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <input
                                                        className={`w-full bg-transparent border-none outline-none text-sm font-semibold placeholder-gray-300 transition-colors italic ${focusedRow === idx ? 'text-white placeholder-white/30' : 'text-gray-600'}`}
                                                        value={day.notes || ''}
                                                        placeholder="Specify resource utilization..."
                                                        onFocus={() => setFocusedRow(idx)}
                                                        onBlur={() => setFocusedRow(null)}
                                                        onChange={e => updateDay(idx, 'notes', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            className={`w-16 rounded-lg py-1.5 text-center text-sm font-bold transition-all outline-none border ${focusedRow === idx ? 'bg-white/20 border-white/40 text-white focus:bg-white/30 focus:border-white' : 'bg-white border-gray-100 text-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10'}`}
                                                            type="number"
                                                            step="0.5"
                                                            value={day.hours}
                                                            onFocus={() => setFocusedRow(idx)}
                                                            onBlur={() => setFocusedRow(null)}
                                                            onChange={e => updateDay(idx, 'hours', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View: Hidden on Tablet/Desktop */}
                            <div className="md:hidden divide-y divide-gray-50 max-h-[500px] overflow-y-auto nx-ts-scroll-common">
                                {formData.days.map((day, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`p-5 transition-all duration-200 ${focusedRow === idx ? 'bg-[var(--theme-primary)] text-white' : 'bg-white'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className={`text-xs font-bold ${focusedRow === idx ? 'text-white' : 'text-gray-800'}`}>{day.date}</div>
                                                <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${focusedRow === idx ? 'text-white/60' : 'text-gray-400'}`}>Protocol Reference</div>
                                            </div>
                                            <div className="w-16">
                                                <input
                                                    className={`w-full rounded-lg py-2 text-center text-xs font-bold transition-all outline-none border ${focusedRow === idx ? 'bg-white/20 border-white/40 text-white' : 'bg-gray-50 border-gray-100 text-[var(--theme-primary)]'}`}
                                                    type="number"
                                                    step="0.5"
                                                    value={day.hours}
                                                    onFocus={() => setFocusedRow(idx)}
                                                    onBlur={() => setFocusedRow(null)}
                                                    onChange={e => updateDay(idx, 'hours', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                className={`w-full bg-transparent border-none outline-none text-xs font-medium placeholder-gray-300 transition-colors italic ${focusedRow === idx ? 'text-white placeholder-white/30' : 'text-gray-500'}`}
                                                value={day.notes || ''}
                                                placeholder="Specify resource utilization..."
                                                onFocus={() => setFocusedRow(idx)}
                                                onBlur={() => setFocusedRow(null)}
                                                onChange={e => updateDay(idx, 'notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-8 sm:right-8 z-50 py-4 px-6 rounded-2xl shadow-2xl border flex items-center justify-between sm:justify-start gap-4 ${message.startsWith('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-[var(--theme-primary)] nx-ts-text-primary'}`}
                    style={!message.startsWith('Error') ? { color: 'var(--theme-primary)' } : {}}
                >
                    <div className="flex items-center gap-3">
                        {message.startsWith('Error') ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
                        <span className="text-[12px] sm:text-[13px] font-bold">{message}</span>
                    </div>
                    <button onClick={() => setMessage('')} className="shrink-0 p-1.5 hover:bg-black/5 rounded-full transition-colors"><FiX size={16} /></button>
                </motion.div>
            )}
        </div>
    );
};

export default TimesheetConsole;
