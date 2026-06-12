import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../../utils/api';
import {
    FiSend, FiClock, FiCheckCircle, FiAlertCircle,
    FiTrash2, FiUpload, FiChevronDown, FiSearch, FiFolder,
    FiCalendar, FiChevronLeft, FiChevronRight, FiX,
    FiActivity, FiZap, FiPieChart, FiCpu, FiStar, FiCopy, FiList, FiDownload
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import EliteSelector from '../../common/EliteSelector';
import EliteDatePicker from '../../common/EliteDatePicker';
import * as XLSX from 'xlsx';
import { useAlert } from '../../../context/AlertContext';

const TimesheetConsole = ({ user: initialUser, isAdminMode, perfStats, refreshStats }) => {
    const { showAlert } = useAlert();

    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        project_id: '',
        start_date: '',
        end_date: '',
        days: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedRow, setFocusedRow] = useState(null);
    const fileInputRef = useRef(null);

    // Dynamic Greeting Monitor
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Pulse every minute
        return () => clearInterval(timer);
    }, []);

    const greetingMsg = useMemo(() => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    }, [currentTime]);

    // Handle "View as Employee" simulated identity
    const displayName = useMemo(() => {
        const realName = initialUser?.first_name || 'Team Member';
        const isActuallyAdmin = initialUser?.roles?.some(r => ['admin', 'superadmin'].includes(r));

        if (isActuallyAdmin && isAdminMode === false) {
            return "Elite Associate (Mock View)";
        }
        return realName;
    }, [initialUser, isAdminMode]);

    const metrics = useMemo(() => {
        const totalHours = formData.days.reduce((sum, day) => sum + (parseFloat(day.hours) || 0), 0);
        const activeDays = formData.days.length;
        const avgUtilization = activeDays > 0 ? (totalHours / (activeDays * 8) * 100).toFixed(0) : 0;
        return { totalHours, activeDays, avgUtilization };
    }, [formData.days]);

    useEffect(() => {
        api.get('/timesheets/my-projects')
            .then(res => setProjects(res.data))
            .catch(err => console.error("Failed to load projects", err));
    }, []);

    // Quick Actions: Flash Fill
    const flashFill = () => {
        if (formData.days.length === 0) {
            showAlert("Please select a date range first.", "info");
            return;
        }
        const newDays = formData.days.map(day => ({ ...day, hours: 8 }));
        setFormData({ ...formData, days: newDays });
        showAlert("Applied standard 8h day to all entries.", "success");
    };

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
                showAlert("The selected file appears to be empty.", "error");
                return;
            }

            const mappedDays = data.map(row => {
                // Enterprise Robust Mapping Logic
                const d = row['Date'] || row['date'] || row['DATE'] || row['Day'] || '';
                const h = row['Hours Worked'] || row['hours'] || row['Hours'] || row['H'] || row['Effort'] || 0;
                const ot = row['Overtime'] || row['OT'] || row['ot_hours'] || row['Overtime Hours'] || 0;
                const n = row['Task Description'] || row['notes'] || row['Task'] || row['Activity'] || row['Comments'] || row['WORK DONE'] || '';
                
                return {
                    date: d,
                    hours: parseFloat(h) || 0,
                    ot_hours: parseFloat(ot) || 0,
                    notes: n
                };
            }).filter(day => day.date);

            if (mappedDays.length === 0) {
                showAlert("Could not find valid dates in the Excel file.", "error");
                return;
            }

            const dates = mappedDays.map(d => new Date(d.date)).sort((a, b) => a - b);
            const start = dates[0].toISOString().split('T')[0];
            const end = dates[dates.length - 1].toISOString().split('T')[0];

            setFormData({
                ...formData,
                start_date: start,
                end_date: end,
                days: mappedDays
            });
            showAlert("Dataset updated successfully.", "success");
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
                showAlert("Maximum span is 31 days per submission.", "error");
                setFormData(newFormData);
                return;
            }
            if (diffDays <= 0) {
                showAlert("Please check your start and end dates.", "error");
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
        }
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/timesheets/submit', formData);
            showAlert("Timesheet successfully sent for approval.", "success");
            setFormData({ project_id: '', start_date: '', end_date: '', days: [] });
            if (refreshStats) refreshStats();
        } catch (err) {
            showAlert(err.response?.data?.message || "Something went wrong during submission.", "error");
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
        <div className="nx-ts-animate w-full flex flex-col gap-6 pb-12">

            {/* --- SUBMISSION HUB (Matrix Workspace) --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/30"
            >
                {/* Hub Identity Header */}
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between rounded-t-[31px]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--theme-primary)] border border-slate-100">
                            <FiSend size={20} />
                        </div>
                        <div>
                            <div className="text-slate-800 font-black text-base tracking-tight leading-none uppercase">Mission Workspace</div>
                            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                {greetingMsg}, <span className="text-[var(--theme-primary)]">{displayName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <a 
                            href="https://hrms-crm-bucket.s3.ap-south-1.amazonaws.com/templates/timesheet_template.xlsx" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-50 text-slate-600 px-4 sm:px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-100 shadow-sm"
                            title="Download Sample Template"
                        >
                            <FiDownload size={14} className="text-blue-500" />
                            <span className="hidden sm:inline">Download Template</span>
                        </a>

                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="bg-white hover:bg-slate-50 text-slate-600 px-4 sm:px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-100 shadow-sm"
                            title="Import Data Payload"
                        >
                            <FiUpload size={14} className="text-[var(--theme-primary)]" />
                            <span className="hidden sm:inline">Import Data Payload</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* INPUT BLOCK */}
                        <div className="lg:col-span-8 space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                <div className="sm:col-span-2">
                                    <EliteSelector
                                        label="Primary Project Assignment"
                                        placeholder="Select Operational Project"
                                        options={projects}
                                        value={formData.project_id}
                                        onChange={(id) => setFormData({ ...formData, project_id: id })}
                                        icon={FiFolder}
                                    />
                                </div>
                                <EliteDatePicker
                                    label="Authorization Start"
                                    value={formData.start_date}
                                    icon={FiCalendar}
                                    onChange={(date) => handleDateChange({ target: { name: 'start_date', value: date } })}
                                />
                                <EliteDatePicker
                                    label="Authorization End"
                                    value={formData.end_date}
                                    icon={FiCalendar}
                                    onChange={(date) => handleDateChange({ target: { name: 'end_date', value: date } })}
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={flashFill}
                                    className="px-6 py-3 rounded-xl bg-[var(--theme-primary)]/5 text-[var(--theme-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--theme-primary)] hover:text-white transition-all flex items-center gap-2 border border-[var(--theme-primary)]/10"
                                >
                                    <FiZap size={14} /> Flash-Fill Allocation (8h)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, days: [] })}
                                    className="px-6 py-3 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"
                                >
                                    <FiTrash2 size={14} /> Reset Workflow
                                </button>
                            </div>
                        </div>

                        {/* SUBMIT BLOCK */}
                        <div className="lg:col-span-4 flex flex-col justify-end">
                            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 mb-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Summary Protocol</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[13px] font-bold">
                                        <span className="text-slate-500">Captured Effort</span>
                                        <span className="text-slate-800">{metrics.totalHours}h</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[13px] font-bold">
                                        <span className="text-slate-500">Active Nodes</span>
                                        <span className="text-slate-800">{metrics.activeDays} Days</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.project_id || formData.days.length === 0}
                                className="w-full h-[72px] rounded-2xl flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl"
                                style={{
                                    backgroundColor: (!formData.project_id || formData.days.length === 0) ? 'var(--theme-bg)' : 'var(--theme-primary)',
                                    color: (!formData.project_id || formData.days.length === 0) ? 'var(--theme-text)' : '#ffffff',
                                    opacity: (!formData.project_id || formData.days.length === 0) ? 0.3 : 1,
                                    boxShadow: (!formData.project_id || formData.days.length === 0) ? 'none' : '0 10px 30px -5px var(--theme-primary-border)',
                                    border: 'none',
                                    cursor: (!formData.project_id || formData.days.length === 0) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <FiSend size={18} />
                                )}
                                {isSubmitting ? "Transmitting..." : "Authorize Submission"}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>


            {/* --- ACTIVITY LOG REGISTRY (CARDS) --- */}
            <AnimatePresence>
                {formData.days.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        className="w-full bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--theme-primary)] border border-slate-100">
                                    <FiList size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">Daily Effort Registry</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-60 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] animate-pulse" /> Validating {formData.days.length} entries
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/10">
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Temporal Node</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Telemetry</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Quantum (h)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {formData.days.map((day, idx) => (
                                        <tr key={idx} className={`transition-colors duration-200 ${focusedRow === idx ? 'bg-[var(--theme-primary)]/[0.02]' : 'hover:bg-slate-50/30'}`}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${focusedRow === idx ? 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/20 scale-110' : 'bg-slate-50 text-slate-300'}`}>
                                                        <FiCalendar size={16} />
                                                    </div>
                                                    <div>
                                                        <div className={`text-[13px] font-black transition-colors ${focusedRow === idx ? 'text-[var(--theme-primary)]' : 'text-slate-700'}`}>
                                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                            <FiStar size={8} /> Ref D-{idx + 1}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <input
                                                    className="w-full bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 placeholder-slate-200 focus:text-slate-800 transition-all px-4 py-3 rounded-xl focus:bg-white focus:shadow-sm"
                                                    value={day.notes || ''}
                                                    placeholder="Detail operational activity..."
                                                    onFocus={() => setFocusedRow(idx)}
                                                    onBlur={() => setFocusedRow(null)}
                                                    onChange={e => updateDay(idx, 'notes', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center">
                                                    <div className={`relative group/input transition-all ${focusedRow === idx ? 'scale-110' : ''}`}>
                                                        <input
                                                            className={`w-20 h-12 rounded-xl text-center text-[14px] font-black outline-none border transition-all shadow-sm
                                                                ${focusedRow === idx 
                                                                    ? 'bg-white border-[var(--theme-primary)] text-[var(--theme-primary)] ring-4 ring-[var(--theme-primary)]/5' 
                                                                    : 'bg-slate-50/50 border-slate-100 text-slate-500 group-hover/input:border-slate-200'}`}
                                                            type="number"
                                                            step="0.5"
                                                            value={day.hours}
                                                            onFocus={() => setFocusedRow(idx)}
                                                            onBlur={() => setFocusedRow(null)}
                                                            onChange={e => updateDay(idx, 'hours', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TimesheetConsole;
