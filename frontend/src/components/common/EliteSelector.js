import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiChevronDown, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EliteSelector - Universal Command Protocol
 * A high-fidelity, searchable, and responsive selection engine for the HRMS Elite Suite.
 * 
 * Props:
 * - label: String (The header text)
 * - options: Array [ {id, name, code, email, icon} ]
 * - value: Any (Current selected ID)
 * - onChange: Function (Returns selected ID)
 * - placeholder: String
 * - icon: Component (Default icon for the trigger)
 * - isSearchable: Boolean (Allow internal search)
 * - className: String (Custom container styling)
 */
const EliteSelector = ({ 
    label, 
    options = [], 
    value, 
    onChange, 
    placeholder, 
    icon: Icon,
    isSearchable = true,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const selectorRef = useRef(null);
    
    // Safety check for options
    const safeOptions = Array.isArray(options) ? options : [];
    const selectedOption = safeOptions.find(o => String(o.id) === String(value));

    // Intelligence: Close on outside click or Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleEvents = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (selectorRef.current && !selectorRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleEvents);
        document.addEventListener('keydown', handleEvents);
        return () => {
            document.removeEventListener('mousedown', handleEvents);
            document.removeEventListener('keydown', handleEvents);
        };
    }, [isOpen]);

    const filteredOptions = safeOptions.filter(o => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            String(o.name || '').toLowerCase().includes(s) || 
            String(o.code || '').toLowerCase().includes(s) ||
            String(o.email || '').toLowerCase().includes(s)
        );
    });

    return (
        <div className={`nx-ts-form-group relative ${className}`} ref={selectorRef}>
            {label && (
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 block px-1">
                    {label}
                </label>
            )}
            
            <div 
                className={`nx-ts-input-wrap cursor-pointer flex items-center justify-between transition-all px-0 ${isOpen ? 'ring-2 ring-[var(--theme-primary)] border-[var(--theme-primary)] shadow-sm' : 'border-gray-200 hover:border-[var(--theme-primary)]'}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{ height: '52px', background: 'white', borderRadius: '14px' }}
            >
                <div className="flex items-center flex-1 overflow-hidden px-5 gap-3">
                    {Icon && <Icon size={18} className="text-gray-300 flex-shrink-0" />}
                    <span className={`text-[13px] font-semibold truncate ${selectedOption ? (selectedOption.is_active === false ? 'text-gray-400 line-through' : 'text-gray-700') : 'text-gray-400'}`}>
                        {selectedOption 
                            ? (selectedOption.is_active === false ? `${selectedOption.name} (DEACTIVATED)` : selectedOption.name) 
                            : `-- ${placeholder} --`}
                    </span>
                </div>
                <div className="px-4 flex items-center border-l border-gray-100 h-2/3 my-auto ml-2">
                    <FiChevronDown className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} size={16} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute z-[9999] w-full left-0 top-[calc(100%+4px)] bg-white border border-gray-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden"
                    >
                        {isSearchable && safeOptions.length > 5 && (
                            <div className="p-3 flex items-center gap-2 border-b border-gray-50 bg-gray-50/20">
                                <div className="flex-1 relative">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                    <input 
                                        className="w-full h-10 bg-white border border-gray-100 rounded-xl pl-11 pr-4 text-[13px] focus:outline-none focus:border-[var(--theme-primary)] shadow-sm transition-all"
                                        placeholder="Identification Lookup..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-all"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        )}

                        <div className="max-h-[320px] overflow-y-auto px-1.5 py-1.5 custom-scrollbar">
                            {filteredOptions.length === 0 ? (
                                <div className="p-12 text-center text-[12px] text-gray-400 font-medium italic">
                                    No active matches discovered in the registry.
                                </div>
                            ) : (
                                [...filteredOptions].sort((a, b) => {
                                    const aActive = a.is_active !== false;
                                    const bActive = b.is_active !== false;
                                    if (aActive && !bActive) return -1;
                                    if (!aActive && bActive) return 1;
                                    return 0;
                                }).map(opt => {
                                    const isDeactivated = opt.is_active === false;
                                    return (
                                        <div 
                                            key={opt.id}
                                            className={`p-3.5 rounded-xl transition-all flex justify-between items-center mb-0.5 group 
                                                ${isDeactivated 
                                                    ? 'bg-gray-50/50 cursor-not-allowed opacity-60' 
                                                    : String(opt.id) === String(value) 
                                                        ? 'bg-[var(--theme-secondary,#d3d1ff)] text-[var(--theme-primary)] shadow-sm' 
                                                        : 'cursor-pointer hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] text-gray-600'
                                                }`}
                                            onClick={(e) => {
                                                if (isDeactivated) return;
                                                e.stopPropagation();
                                                onChange(opt.id);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                        >
                                            <div className="flex flex-col flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    {opt.icon && <div className={`flex-shrink-0 ${isDeactivated ? 'text-gray-300' : String(opt.id) === String(value) ? 'text-[var(--theme-primary)]' : 'text-gray-400 group-hover:text-[var(--theme-primary)]'}`}>{opt.icon}</div>}
                                                    <span className={`text-[13.5px] font-bold truncate ${isDeactivated ? 'line-through text-gray-400' : ''}`}>
                                                        {opt.name} {isDeactivated && <span className="text-[10px] ml-1 opacity-50 font-black tracking-widest">(DEACTIVATED)</span>}
                                                    </span>
                                                </div>
                                                {(opt.code || opt.email) && (
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 pl-0 
                                                        ${isDeactivated ? 'text-gray-300 line-through' : String(opt.id) === String(value) ? 'text-[var(--theme-primary)] opacity-60' : 'text-gray-400 group-hover:text-[var(--theme-primary)] group-hover:opacity-60'}`}>
                                                        {opt.code || opt.email}
                                                    </span>
                                                )}
                                            </div>
                                            {String(opt.id) === String(value) && !isDeactivated && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] shadow-sm" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EliteSelector;
