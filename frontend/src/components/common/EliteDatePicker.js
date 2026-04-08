import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EliteDatePicker - Universal Calendar Protocol
 * A high-fidelity, responsive date picking engine for the HRMS Elite Suite.
 * 
 * Props:
 * - value: String (YYYY-MM-DD)
 * - onChange: Function (Returns YYYY-MM-DD)
 * - label: String
 */
const EliteDatePicker = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const handleMonthChange = (offset) => {
        const nextDate = new Date(viewDate);
        nextDate.setMonth(viewDate.getMonth() + offset);
        setViewDate(nextDate);
    };

    const handleSelect = (day) => {
        const selected = new Date(year, month, day);
        const formatted = selected.toISOString().split('T')[0];
        onChange(formatted);
        setIsOpen(false);
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const isSelected = (day) => {
        if (!value) return false;
        const sel = new Date(value);
        return sel.getDate() === day && sel.getMonth() === month && sel.getFullYear() === year;
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startOffset = firstDayOfMonth(year, month);

        for (let i = 0; i < startOffset; i++) {
            days.push(<div key={`empty-${i}`} className="nx-ts-cal-day empty" />);
        }

        for (let day = 1; day <= totalDays; day++) {
            days.push(
                <div 
                    key={day} 
                    className={`nx-ts-cal-day ${isSelected(day) ? 'active' : ''} ${isToday(day) ? 'today' : ''}`}
                    onClick={() => handleSelect(day)}
                >
                    {day}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="nx-ts-dropdown-wrap" ref={dropdownRef}>
            <div 
                className={`nx-ts-dropdown-trigger cursor-pointer flex items-center justify-between transition-all px-0 ${isOpen ? 'ring-2 ring-[var(--theme-primary)] border-[var(--theme-primary)] shadow-sm' : 'border-gray-200 hover:border-[var(--theme-primary)]'}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{ height: '52px', background: 'white', borderRadius: '14px', border: '1.5px solid #e5e7eb' }}
            >
                <div className="flex items-center flex-1 overflow-hidden px-5 gap-3">
                    <FiCalendar className={value ? "text-[var(--theme-primary)]" : "text-gray-300"} size={18} />
                    <span className={`text-[13px] font-semibold truncate ${value ? "text-gray-800" : "text-gray-400"}`}>
                        {value || `Select ${label}...`}
                    </span>
                </div>
                <div className="px-4 flex items-center border-l border-gray-100 h-2/3 my-auto ml-2">
                    <FiChevronDown className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="nx-ts-calendar-wrap"
                        style={{ top: 'calc(100% + 4px)', zIndex: 9999 }}
                    >
                        <div className="nx-ts-cal-header">
                            <span className="nx-ts-cal-title">{monthName} {year}</span>
                            <div className="nx-ts-cal-nav">
                                <button type="button" className="nx-ts-cal-nav-btn" onClick={() => handleMonthChange(-1)}><FiChevronLeft /></button>
                                <button type="button" className="nx-ts-cal-nav-btn" onClick={() => handleMonthChange(1)}><FiChevronRight /></button>
                            </div>
                        </div>
                        <div className="nx-ts-cal-grid">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="nx-ts-cal-weekday">{d}</div>
                            ))}
                            {renderDays()}
                        </div>
                        <div className="nx-ts-cal-footer">
                            <button type="button" className="nx-ts-cal-footer-btn" onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                onChange(today);
                                setIsOpen(false);
                            }}>Today</button>
                            <button type="button" className="nx-ts-cal-footer-btn" onClick={() => setIsOpen(false)}>Close</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EliteDatePicker;
