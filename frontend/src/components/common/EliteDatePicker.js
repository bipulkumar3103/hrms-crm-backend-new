import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiCalendar, 
    FiChevronLeft, 
    FiChevronRight, 
    FiX, 
    FiCheck, 
    FiChevronDown 
} from 'react-icons/fi';

const EliteDatePicker = ({ label, value, onChange, disabled = false, placeholder = "Select Date" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    
    // Parse initial date
    const initialDate = value ? new Date(value) : new Date();
    const [viewDate, setViewDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [viewMode, setViewMode] = useState('days'); // 'days', 'months', 'years'

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setViewMode('days');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setSelectedDate(newDate);
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const date = String(newDate.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${date}`);
        setIsOpen(false);
    };

    const renderDaysView = () => {
        const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const firstDayOfMonth = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
        
        const dayElements = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            dayElements.push(<div key={`pad-${i}`} className="h-9 w-9"></div>);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), d).toDateString();
            const isSelected = selectedDate && selectedDate.toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), d).toDateString();
            
            dayElements.push(
                <div 
                    key={d}
                    onClick={() => handleDateSelect(d)}
                    className={`
                        h-9 w-9 flex items-center justify-center rounded-xl text-[13px] font-bold cursor-pointer transition-all
                        ${isSelected 
                            ? 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/20 scale-110' 
                            : isToday 
                                ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] border border-[var(--theme-primary)]/20' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                >
                    {d}
                </div>
            );
        }

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map(day => (
                        <div key={day} className="h-9 w-9 flex items-center justify-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {dayElements}
                </div>
            </motion.div>
        );
    };

    const renderMonthsView = () => (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-3 gap-2 py-2">
            {months.map((m, i) => (
                <div 
                    key={m} 
                    onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setViewMode('days'); }}
                    className={`px-3 py-4 rounded-xl text-[12px] font-bold text-center cursor-pointer transition-all ${viewDate.getMonth() === i ? 'bg-[var(--theme-primary)] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    {m.substring(0, 3)}
                </div>
            ))}
        </motion.div>
    );

    const renderYearsView = () => {
        const currentYear = viewDate.getFullYear();
        const years = [];
        for (let i = currentYear - 10; i <= currentYear + 10; i++) {
            years.push(i);
        }

        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-4 gap-2 py-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <div 
                        key={year} 
                        onClick={() => { setViewDate(new Date(year, viewDate.getMonth(), 1)); setViewMode('days'); }}
                        className={`py-3 rounded-xl text-[12px] font-bold text-center cursor-pointer transition-all ${viewDate.getFullYear() === year ? 'bg-[var(--theme-primary)] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {year}
                    </div>
                ))}
            </motion.div>
        );
    };

    return (
        <div className="mb-4 relative" ref={containerRef}>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-4 py-2.5 rounded-xl border outline-none transition-all font-semibold text-[14px] shadow-sm
                    ${disabled 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100' 
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'}
                `}
            >
                <span className={!value ? 'text-gray-400 font-medium' : ''}>
                    {value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : placeholder}
                </span>
                <FiCalendar className={disabled ? 'text-gray-300' : 'text-[var(--theme-primary)]'} size={18} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-5 z-[100] min-w-[300px]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-1 group">
                                <button 
                                    type="button"
                                    onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                                    className={`text-[15px] font-black tracking-tight px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'months' ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)]' : 'text-gray-800 hover:bg-gray-50'}`}
                                >
                                    {months[viewDate.getMonth()]}
                                    <FiChevronDown size={14} className={`opacity-40 transition-transform ${viewMode === 'months' ? 'rotate-180 text-[var(--theme-primary)]' : ''}`} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                                    className={`text-[15px] font-black tracking-tight px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'years' ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)]' : 'text-gray-800 hover:bg-gray-50'}`}
                                >
                                    {viewDate.getFullYear()}
                                    <FiChevronDown size={14} className={`opacity-40 transition-transform ${viewMode === 'years' ? 'rotate-180 text-[var(--theme-primary)]' : ''}`} />
                                </button>
                            </div>
                            
                            {viewMode === 'days' && (
                                <div className="flex gap-1">
                                    <button 
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[var(--theme-primary)] transition-colors"
                                    >
                                        <FiChevronLeft size={18} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[var(--theme-primary)] transition-colors"
                                    >
                                        <FiChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Dynamic Views */}
                        <div className="min-h-[220px]">
                            {viewMode === 'days' && renderDaysView()}
                            {viewMode === 'months' && renderMonthsView()}
                            {viewMode === 'years' && renderYearsView()}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
                            <button 
                                type="button"
                                onClick={() => { onChange(''); setIsOpen(false); setViewMode('days'); }}
                                className="text-[11px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors px-2"
                            >
                                Clear
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    const year = today.getFullYear();
                                    const month = String(today.getMonth() + 1).padStart(2, '0');
                                    const date = String(today.getDate()).padStart(2, '0');
                                    onChange(`${year}-${month}-${date}`);
                                    setIsOpen(false);
                                    setViewMode('days');
                                }}
                                className="text-[11px] font-bold text-[var(--theme-primary)] uppercase tracking-widest hover:underline px-2"
                            >
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default EliteDatePicker;
