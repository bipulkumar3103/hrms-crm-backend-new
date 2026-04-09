import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditor } from '@craftjs/core';
import * as Icons from 'react-icons/fi';
import { FiSettings, FiMousePointer, FiPlus, FiTrash2, FiSearch, FiCheck, FiCopy, FiChevronDown, FiXCircle, FiMonitor, FiTablet, FiSmartphone, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../utils/api';

const EliteUnitInput = ({ value, onChange, propName }) => {
  // Parsing engine for multi-unit strings
  const parseValue = (val) => {
    const str = String(val || '');
    if (str === 'auto') return { num: '', unit: 'auto' };
    const match = str.match(/^([\d.-]+)([a-zA-Z%]*)$/);
    if (!match) return { num: '', unit: 'px' };
    return { 
      num: match[1], 
      unit: match[2] || 'px' 
    };
  };

  const { num, unit } = parseValue(value);
  const units = ['px', 'rem', '%', 'vw', 'vh'];
  
  const handleUpdate = (newNum, newUnit) => {
    onChange(`${newNum}${newUnit || unit}`);
  };

  const nextUnit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const idx = units.indexOf(unit.toLowerCase());
    const next = units[(idx + 1) % units.length];
    handleUpdate(num, next);
  };

  const max = unit === '%' ? 100 : (unit === 'rem' ? 20 : 200);
  const step = unit === 'rem' ? 0.1 : 1;

  const isAuto = unit === 'auto';

  return (
    <div className={`p-2 border rounded-xl group transition-all duration-300 animate-in fade-in zoom-in-95 ${isAuto ? 'bg-[var(--theme-primary)]/5 border-[var(--theme-primary)]/20 shadow-inner' : 'bg-gray-50/30 border-gray-100 hover:border-[var(--theme-primary)]/40 hover:bg-white hover:shadow-xl hover:shadow-[var(--theme-primary)]/5'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Numeric Input with Steer Arrows */}
          {!isAuto ? (
            <div className="flex items-center bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm group-hover:border-[var(--theme-primary)]/20">
              <input 
                type="number"
                value={num}
                step={step}
                onChange={(e) => handleUpdate(e.target.value)}
                className="w-14 pl-2 py-1.5 bg-transparent text-sm font-semibold text-slate-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex flex-col border-l border-gray-100">
                <button 
                  onClick={() => handleUpdate(Number(num || 0) + step)}
                  className="px-1.5 py-0.5 hover:bg-gray-50 text-gray-400 hover:text-[var(--theme-primary)] transition-colors border-b border-gray-100"
                >
                  <Icons.FiChevronUp size={10} />
                </button>
                <button 
                  onClick={() => handleUpdate(Math.max(0, Number(num || 0) - step))}
                  className="px-1.5 py-0.5 hover:bg-gray-50 text-gray-400 hover:text-[var(--theme-primary)] transition-colors"
                >
                  <Icons.FiChevronDown size={10} />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-14 py-1.5 flex items-center justify-center bg-[var(--theme-primary)]/10 rounded-lg border border-[var(--theme-primary)]/20 shadow-inner">
              <span className="text-[10px] font-semibold text-[var(--theme-primary)]">Auto</span>
            </div>
          )}

          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 shadow-inner">
            <button 
              onClick={nextUnit}
              title="Cycle Units"
              className={`px-2 py-1 flex items-center justify-center text-[10px] font-semibold rounded-md transition-all ${!isAuto ? 'bg-white text-[var(--theme-primary)] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {isAuto ? 'px' : unit}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleUpdate('', 'auto'); }}
              className={`px-2 py-1 flex items-center justify-center text-[10px] font-semibold rounded-md transition-all ${isAuto ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-gray-400 hover:text-[var(--theme-primary)]'}`}
            >
              Auto
            </button>
          </div>
        </div>
        <div className={`text-[9px] font-semibold transition-opacity ${isAuto ? 'text-[var(--theme-primary)] opacity-100' : 'text-gray-400 opacity-40 group-hover:opacity-100'}`}>
          {isAuto ? 'Dynamic' : 'Fixed'}
        </div>
      </div>
    </div>
  );
};

/**
 * Deep-flatten an object into dot-notated paths (e.g. user.profile.name)
 * Refined to match UIBuilder's robust discovery engine.
 */
const flattenObject = (obj, prefix = '') => {
  if (obj === null || typeof obj !== 'object') return {};

  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    const currentPath = pre + k;
    const val = obj[k];

    // Determine type for display
    let type = 'String';
    if (val === null) type = 'null';
    else if (Array.isArray(val)) type = 'Array';
    else if (typeof val === 'number') type = 'Number';
    else if (typeof val === 'boolean') type = 'Boolean';
    else if (typeof val === 'object') type = 'Object';

    // Store metadata
    acc[currentPath] = {
      path: currentPath,
      type: type,
      sample: val !== null && typeof val === 'object'
        ? (Array.isArray(val) ? `[${val.length} items]` : '{...}')
        : String(val)
    };

    // Recursive flatten for nested objects and arrays
    if (val !== null && typeof val === 'object') {
      Object.assign(acc, flattenObject(val, currentPath));
    }
    return acc;
  }, {});
};

const isPathField = (key) => {
  const k = key.toLowerCase();
  return k.includes('path') || k === 'bind' || k === 'name' || k === 'key';
};

const ELITE_OPTIONS = {
  variant: ['solid', 'outline', 'ghost'],
  color: ['primary', 'accent', 'rose', 'amber'],
  backgroundColor: ['transparent', 'primary', 'accent', 'rose', 'amber', 'white', 'gray-50'],
  borderColor: ['transparent', 'primary', 'accent', 'rose', 'amber', 'gray-100'],
  size: ['sm', 'md', 'lg'],
  alignment: ['left', 'center', 'right'],
  fullWidth: ['true', 'false'],
  borderStyle: ['solid', 'dashed', 'dotted', 'none'],
  borderRadius: ['0px', '4px', '8px', '12px', '16px', '24px', '32px', '9999px'],
  fontSize: ['10px', '12px', '14px', '16px', '18px', '20px', '24px'],
  iconSize: ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px'],
  flexWrap: ['nowrap', 'wrap'],
  noStack: [true, false],
  showIcon: ['true', 'false'],
  textColor: ['white', 'black', 'gray-100', 'gray-400', 'gray-800'],
  borderWidth: ['0px', '1px', '2px', '3px', '4px', '8px'],
  flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
  alignItems: ['flex-start', 'center', 'flex-end', 'stretch'],
  justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'],
  display: ['block', 'inline-block', 'flex', 'inline-flex', 'none'],
  icon: [
    'FiArrowRight', 'FiArrowLeft', 'FiPlus', 'FiTrash2', 'FiSettings', 'FiSearch', 'FiSend', 'FiSave',
    'FiBell', 'FiCalendar', 'FiCheck', 'FiChevronRight', 'FiCloud', 'FiDownload', 'FiEdit', 'FiExternalLink',
    'FiFile', 'FiFilter', 'FiHeart', 'FiHome', 'FiImage', 'FiInfo', 'FiLayers', 'FiLink', 'FiList',
    'FiLock', 'FiLogOut', 'FiMail', 'FiMapPin', 'FiMenu', 'FiMessageCircle', 'FiMonitor', 'FiMoreHorizontal',
    'FiPackage', 'FiPhone', 'FiPieChart', 'FiPlay', 'FiRefreshCw', 'FiShare2', 'FiShoppingCart', 'FiStar',
    'FiTag', 'FiTerminal', 'FiThumbsUp', 'FiUser', 'FiUsers', 'FiVideo', 'FiWifi', 'FiZap'
  ]
};

const THEME_COLOR_MAP = {
  primary: 'var(--theme-primary)',
  accent: '#6366f1',
  rose: '#f43f5e',
  amber: '#f59e0b',
  transparent: 'transparent',
  white: '#ffffff',
  'gray-50': '#f8fafc',
  'gray-100': '#f1f5f9'
};

const EliteColorPicker = ({ value, onChange }) => {
  const inputRef = React.useRef();

  return (
    <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-200">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
        style={{
          backgroundColor: value || '#000000',
          boxShadow: `0 10px 15px -3px ${value}40, 0 4px 6px -4px ${value}40`
        }}
      />
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#hexcode"
          className="w-full pl-4 pr-10 py-3 bg-white border-2 border-gray-100 rounded-2xl text-[11px] font-semibold focus:border-[var(--theme-primary)] transition-all outline-none"
        />
        <FiPlus className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
      </div>
      <input
        ref={inputRef}
        type="color"
        value={value?.startsWith('#') ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="hidden"
      />
    </div>
  );
};

const EliteDropdown = ({ value, onChange, options, propName, colorMap, hideCustom = false, placeholder = "Select value..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [openUp, setOpenUp] = useState(false);
  const isColor = propName?.toLowerCase().includes('color') || propName?.toLowerCase().includes('background');
  const isIcon = propName === 'icon';

  const filteredOptions = options.filter(opt =>
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // In this high-density scrollable sidebar, we ALWAYS favor DOWN.
        // Opening UP hits the sticky header and gets clipped.
        setOpenUp(spaceBelow < 150 && rect.top > 500); 
      }
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Intelligent Display Value (Resolves hex back to Name if possible)
  const resolveDisplayName = (val) => {
    if (val === true || val === 'true') return 'True';
    if (val === false || val === 'false') return 'False';
    if (!val) return '';

    if (isColor) {
      // Find if this value (hex or key) matches any preset names
      const match = Object.entries(colorMap || {}).find(([key, hex]) =>
        String(hex).toLowerCase() === String(val).toLowerCase() || String(key).toLowerCase() === String(val).toLowerCase()
      );
      if (match) return match[0].charAt(0).toUpperCase() + match[0].slice(1);
    }

    return String(val);
  };

  const displayValue = resolveDisplayName(value);
  const [isCustom, setIsCustom] = useState(() => {
    if (value === undefined || value === null || value === '') return false;
    const nameMatch = options.find(opt => String(opt).toLowerCase() === String(value).toLowerCase());
    if (nameMatch) return false;

    // Support hex-to-name matching for isCustom check
    if (isColor && colorMap) {
      const hexMatch = Object.entries(colorMap).find(([key, hex]) => String(hex).toLowerCase() === String(value).toLowerCase());
      if (hexMatch && options.includes(hexMatch[0])) return false;
    }

    return true;
  });

  if (isCustom) {
    return (
      <div className="space-y-3">
        {isColor ? (
          <EliteColorPicker value={value} onChange={onChange} />
        ) : (
          <div className="relative group animate-in fade-in zoom-in duration-200">
            <input
              type="text"
              value={value}
              autoFocus
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter custom value..."
              className="w-full px-4 py-3 bg-white border-2 border-[var(--theme-primary)] rounded-2xl text-xs font-medium text-gray-800 outline-none shadow-lg shadow-[var(--theme-primary)]/5"
            />
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setIsCustom(false); onChange(options[0]); }}
          className="w-full py-2.5 bg-gray-50 text-[9px] font-semibold text-gray-400 hover:text-[var(--theme-primary)] hover:bg-white rounded-xl border border-dashed border-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <FiXCircle size={12} />
          Return to Elite Presets
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium transition-all cursor-pointer flex justify-between items-center hover:border-[var(--theme-primary)] hover:bg-white text-gray-800 shadow-sm active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          {isColor && value && (
            <div
              className="w-3 h-3 rounded-full border border-gray-200 shadow-sm"
              style={{ backgroundColor: colorMap?.[value] || (value?.startsWith('#') ? value : 'transparent') }}
            />
          )}
          {isIcon && value && Icons[value] && (
            <div className="w-5 h-5 flex items-center justify-center text-[var(--theme-primary)]">
              {React.createElement(Icons[value], { size: 14 })}
            </div>
          )}
          <span className={(value !== undefined && value !== null && value !== '') ? 'text-gray-800' : 'text-gray-400 italic'}>
            {displayValue || placeholder}
          </span>
        </div>
        <FiChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--theme-primary)]' : 'text-gray-400'}`} size={14} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[1999]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: openUp ? -10 : 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUp ? -10 : 10, scale: 0.95 }}
              className={`absolute left-0 right-0 ${openUp ? 'bottom-full mb-3' : 'top-full mt-2'} bg-white border border-gray-100 rounded-2xl shadow-2xl z-[2000] p-1.5 flex flex-col min-w-[200px] border-t-theme-primary/10`}
            >
              {/* Intelligent Search Header */}
              <div className="px-2 pt-2 mb-2 flex items-center justify-between">
                <div className="relative group flex-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[var(--theme-primary)] transition-colors" size={13} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Filter ${propName}...`}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-semibold text-gray-800 outline-none focus:bg-white focus:border-[var(--theme-primary)]/20 transition-all"
                  />
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="ml-2 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>

              <div className="max-h-[200px] overflow-y-auto custom-scrollbar px-1.5 space-y-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, index) => (
                    <button
                      key={opt}
                      onClick={() => { onChange(opt); setIsOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[11px] font-medium transition-all flex items-center justify-between group
                      ${displayValue.toUpperCase() === String(opt).toUpperCase()
                          ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-[var(--theme-primary)]/20'
                          : highlightedIndex === index
                            ? 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] border border-[var(--theme-primary)]/10'
                            : 'text-gray-500 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)]'}
                      ${highlightedIndex === index ? 'translate-x-1' : 'hover:translate-x-0.5'}
                    `}
                    >
                      <div className="flex items-center gap-3">
                        {isColor && (
                          <div
                            className={`w-3.5 h-3.5 rounded-full border border-gray-100 shadow-sm transition-transform group-hover:scale-110 ${displayValue.toUpperCase() === String(opt).toUpperCase() ? 'bg-white' : ''}`}
                            style={{ backgroundColor: (displayValue.toUpperCase() === String(opt).toUpperCase()) ? 'white' : colorMap?.[opt] || opt }}
                          />
                        )}
                        {isIcon && Icons[opt] && (
                          <div className={`w-5 h-5 flex items-center justify-center transition-transform group-hover:scale-110 ${displayValue.toUpperCase() === String(opt).toUpperCase() ? 'text-white' : (highlightedIndex === index ? 'text-[var(--theme-primary)]' : 'text-gray-400')}`}>
                            {React.createElement(Icons[opt], { size: 14 })}
                          </div>
                        )}
                        <span className="uppercase tracking-widest text-[10px]">{String(opt)}</span>
                      </div>
                      {displayValue.toUpperCase() === String(opt).toUpperCase() && <FiCheck size={12} />}
                      {highlightedIndex === index && displayValue.toUpperCase() !== String(opt).toUpperCase() && <div className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-pulse" />}
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300 italic">No matches found</p>
                  </div>
                )}
              </div>
              {!hideCustom && (
                <>
                  <div className="h-[1px] bg-gray-50 my-1.5 mx-2" />
                  <button
                    onClick={() => { setIsCustom(true); setIsOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-semibold text-[var(--theme-primary)]/60 hover:bg-[var(--theme-primary)] hover:text-white transition-all flex items-center justify-center group"
                  >
                    Custom Architect
                    <FiPlus className="opacity-0 group-hover:opacity-100 transition-opacity ml-2" size={14} />
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const EliteSearchSelect = ({ value, onChange, placeholder = "Select a data path...", availablePaths = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const hasPaths = availablePaths.length > 0;

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-2xl text-xs font-medium transition-all cursor-pointer flex justify-between items-center group
          ${hasPaths ? 'bg-gray-50 border-gray-100 hover:border-[var(--theme-primary)] text-gray-800' : 'bg-amber-50/30 border-amber-100 text-amber-600'}
        `}
      >
        <span className={value ? 'text-gray-800' : (hasPaths ? 'text-gray-400 italic' : 'text-amber-500 font-medium')}>
          {value || (hasPaths ? placeholder : "⚠️ Scan API First")}
        </span>
        <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${hasPaths ? 'text-gray-400 group-hover:text-[var(--theme-primary)]' : 'text-amber-400'}`} size={14} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[320px]"
          >
            {!hasPaths ? (
              <div className="p-8 text-center bg-amber-50/10">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 animate-pulse">
                  <FiSearch size={20} />
                </div>
                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-1.5">No structure discovered</p>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Enter an API endpoint in the <span className="text-[var(--theme-primary)] font-medium">DataSource</span> field and click the <span className="text-[var(--theme-primary)] font-medium">Search</span> icon to populate this list.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-gray-50 bg-gray-50/30">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="text"
                      placeholder="Search rediscovered paths..."
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                  {availablePaths
                    .filter(p => p.path.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((meta, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(meta.path);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)]/80 group flex flex-col space-y-1
                          ${value === meta.path ? 'bg-[var(--theme-secondary)]/30' : ''}
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] font-medium ${value === meta.path ? 'text-[var(--theme-primary)]' : 'text-gray-700'}`}>{meta.path}</span>
                          <span className="text-[9px] font-semibold uppercase text-gray-300 group-hover:text-[var(--theme-primary)] transition-colors opacity-60 tracking-widest">{meta.type}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate font-medium flex items-center gap-1.5 italic opacity-80">
                          <span className="text-[var(--theme-primary)] not-italic opacity-40 font-semibold">❯</span> {meta.sample}
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export const SettingsPanel = () => {
  const { actions, selected, isEnabled } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    const node = currentNodeId ? state.nodes[currentNodeId] : null;
    let selectedProps = {};

    if (node) {
      selectedProps = node.data.props;
    }

    return {
      isEnabled: state.options.enabled,
      selected: (currentNodeId && node) ? {
        id: currentNodeId,
        name: node.data.displayName || node.data.type?.name || node.data.type?.resolvedName || 'Unknown Block',
        props: selectedProps,
      } : null,
    };
  });

  const [availablePaths, setAvailablePaths] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [activeDevice, setActiveDevice] = useState('desktop'); // desktop, tablet, mobile

  const getPropKey = (prop) => {
    if (activeDevice === 'desktop') return prop;
    return `${prop}${activeDevice.charAt(0).toUpperCase() + activeDevice.slice(1)}`;
  };

  const [companyTheme, setCompanyTheme] = useState(null);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await api.get('/company/me');
        setCompanyTheme(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch company branding", err);
      }
    };
    fetchBranding();
  }, []);

  // Responsive Reset Engine: Force desktop for globally-responsive components
  useEffect(() => {
    if (selected && selected.name !== 'CraftContainer') {
      setActiveDevice('desktop');
    }
  }, [selected?.id]);

  // Elite Dynamic Theme Injection
  useEffect(() => {
    if (companyTheme) {
      const root = document.documentElement;
      Object.keys(companyTheme).forEach(k => {
        if (k.startsWith('theme_') && companyTheme[k]) {
          const varName = `--${k.replace('_color', '').replace(/_/g, '-')}`;
          root.style.setProperty(varName, companyTheme[k]);
          
          // Add a faded version for shadows/borders
          root.style.setProperty(`${varName}-faint`, `${companyTheme[k]}20`);
        }
      });
      console.log('✨ Brand Governance: Dynamic CSS Variables injected.');
    }
  }, [companyTheme]);

  const themeOptions = useMemo(() => {
    if (!companyTheme) return ELITE_OPTIONS;

    // Dynamically build the color options based on API response
    // Filter theme_ related keys (e.g. theme_primary_color -> primary)
    const colorKeys = Object.keys(companyTheme)
      .filter(k => k.startsWith('theme_') && companyTheme[k])
      .map(k => k.replace('theme_', '').replace('_color', ''));

    return {
      ...ELITE_OPTIONS,
      color: colorKeys,
      backgroundColor: ['transparent', ...colorKeys, 'white', 'gray-50'],
      borderColor: ['transparent', ...colorKeys, 'gray-100'],
      textColor: ['white', 'black', ...colorKeys],
    };
  }, [companyTheme]);

  const colorMap = useMemo(() => {
    if (!companyTheme) return THEME_COLOR_MAP;

    const map = { ...THEME_COLOR_MAP };
    Object.keys(companyTheme).forEach(k => {
      if (k.startsWith('theme_')) {
        const key = k.replace('theme_', '').replace('_color', '');
        map[key] = companyTheme[k];
      }
    });
    return map;
  }, [companyTheme]);

  const updateProp = (prop, value) => {
    const key = getPropKey(prop);
    actions.setProp(selected.id, (props) => {
      // Auto-cast strings 'true'/'false' to booleans for the engine
      let finalValue = value;
      if (value === 'true') finalValue = true;
      if (value === 'false') finalValue = false;
      props[key] = finalValue;
    });
  };

  const handleScanAPI = async () => {
    const dataSource = selected.props.dataSource;
    if (!dataSource) return;

    try {
      setIsScanning(true);
      let url = dataSource.trim().replace(/^https?:\/\/[^\/]+/, '').replace(/^\/?api\/v1/, '');
      if (!url.startsWith('/')) url = '/' + url;

      console.log('🚀 Final Scan URL:', url);
      const res = await api.get(url);
      const data = res.data;
      console.log('📦 Raw API Data:', data);

      // Smart discovery: Identify the best sample for flattening
      // Matching UIBuilder's robust discovery logic
      let sample = null;

      if (Array.isArray(data)) {
        // Find the first object in the array (not a string/number)
        sample = data.find(item => item && typeof item === 'object' && !Array.isArray(item));
      } else if (data && typeof data === 'object') {
        // If it's a single object (like /users/me), check if it's a wrapper (e.g. { users: [...] })
        const potentialArrays = Object.values(data).filter(v =>
          Array.isArray(v) && v.length > 0 && typeof v[0] === 'object'
        );

        if (potentialArrays.length > 0) {
          console.log(`📂 Found array at key value, using its first item as sample.`);
          sample = potentialArrays[0][0];
        } else {
          // It's a single flat object (OR an object with string arrays, which we now fall back to the root for)
          console.log('📄 Using root object as sample.');
          sample = data;
        }
      }

      if (sample && typeof sample === 'object') {
        const flatMap = flattenObject(sample);
        const metadata = Object.values(flatMap).filter(p =>
          p.path !== '' &&
          !p.path.startsWith('__') &&
          !['password', 'salt', 'token'].includes(p.path.toLowerCase())
        );
        console.log('✨ Discovered Metadata Paths:', metadata);
        setAvailablePaths(metadata);

        // Elite Handshake Success
        setScanFeedback(`Handshake Successful: ${metadata.length} Dynamic Paths Map Ready`);
        setTimeout(() => setScanFeedback(null), 4000);
      } else {
        console.warn('⚠️ No object structure found in sample:', sample);
        setAvailablePaths([]);
      }
    } catch (err) {
      console.error("❌ Scan Failed:", err);
      if (err.response) console.error("🛑 Server Response Error:", err.response.data);
      setScanFeedback("Handshake Failed: Verify Endpoint Permissions");
      setTimeout(() => setScanFeedback(null), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  const copyToClipboard = (path) => {
    const bindStr = `{{${path}}}`;
    navigator.clipboard.writeText(bindStr);
    setCopyFeedback(path);
    setTimeout(() => setCopyFeedback(null), 2000);
  };



  const renderSimpleInput = (prop, label) => {
    const isDataSource = prop === 'dataSource';
    const isPath = isPathField(prop);
    const key = getPropKey(prop);
    
    // Value resolution: Check for override first, then fall back to tablet, then desktop
    const getResolvedValue = () => {
      if (selected.props[key] !== undefined) return selected.props[key];
      
      // Inheritance logic
      if (activeDevice === 'mobile') {
        const tabletKey = `${prop}Tablet`;
        if (selected.props[tabletKey] !== undefined) return selected.props[tabletKey];
      }
      
      return selected.props[prop] || '';
    };

    const value = getResolvedValue();
    const options = themeOptions[prop];
    const isOverridden = activeDevice !== 'desktop' && selected.props[key] !== undefined;

    return (
      <div key={prop} className="space-y-1">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-gray-400">{label || prop}</label>
            {isOverridden && (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] animate-pulse" title="Breakpoint Override Active" />
            )}
          </div>
          {isDataSource && (
            <button
              onClick={handleScanAPI}
              disabled={isScanning || !value}
              className="text-[10px] font-medium text-[var(--theme-primary)] hover:underline flex items-center gap-1 disabled:opacity-30 transition-all"
            >
              {isScanning ? <div className="w-2.5 h-2.5 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div> : <FiSearch size={12} />}
              {isScanning ? 'Scanning...' : 'Scan API'}
            </button>
          )}
        </div>

        {isPath ? (
          <div className="space-y-1.5">
            <EliteSearchSelect
              value={value}
              onChange={(val) => updateProp(prop, val)}
              availablePaths={availablePaths}
            />
            {value && (
              <p className="px-3 text-[9px] font-medium text-gray-400 italic">Connected to: <span className="text-[var(--theme-primary)] not-italic font-medium">{value}</span></p>
            )}
          </div>
        ) : options ? (
          <EliteDropdown
            value={value}
            onChange={(val) => updateProp(prop, val)}
            options={options}
            propName={prop}
            colorMap={colorMap}
            hideCustom={prop === 'fullWidth' || prop === 'showIcon'}
          />
        ) : ['width', 'height', 'padding', 'margin', 'gap', 'borderRadius', 'fontSize', 'iconSize', 'borderWidth'].some(f => prop.toLowerCase().includes(f.toLowerCase())) ? (
          <EliteUnitInput 
            value={value}
            onChange={(val) => updateProp(prop, val)}
            propName={prop}
          />
        ) : (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => updateProp(prop, e.target.value)}
              placeholder={isDataSource ? "/api/v1/endpoint" : "Enter value..."}
              className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white transition-all outline-none shadow-sm ${isDataSource ? 'pr-10' : ''}`}
            />
            {isDataSource && (
              <button
                onClick={handleScanAPI}
                disabled={isScanning || !value}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all ${isScanning ? 'text-[var(--theme-primary)]' : 'text-gray-300 hover:text-[var(--theme-primary)] hover:bg-white hover:shadow-sm'}`}
              >
                {isScanning ? <div className="w-3.5 h-3.5 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div> : <FiSearch size={16} />}
              </button>
            )}
          </div>
        )}

        {isDataSource && (
          <div className="mt-2 text-center">
            <AnimatePresence>
              {scanFeedback && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="inline-flex items-center gap-2 text-[10px] font-semibold text-[var(--theme-primary)] bg-[var(--theme-secondary)]/10 px-3 py-1.5 rounded-lg"
                >
                  <FiCheck className="animate-bounce" />
                  {scanFeedback}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  const renderArrayEditor = (prop, label, itemFields) => {
    const items = selected.props[prop] || [];

    const addItem = () => {
      const newItem = itemFields.reduce((acc, f) => ({ ...acc, [f.key]: f.default }), {});
      updateProp(prop, [...items, newItem]);
    };

    const removeItem = (idx) => {
      const newItems = [...items];
      newItems.splice(idx, 1);
      updateProp(prop, newItems);
    };

    const updateItem = (idx, fieldKey, val) => {
      const newItems = [...items];
      newItems[idx] = { ...newItems[idx], [fieldKey]: val };
      updateProp(prop, newItems);
    };

    return (
      <div key={prop} className="space-y-4 pt-4 border-t border-gray-50">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-semibold" style={{ color: 'var(--theme-primary)' }}>{label}</label>
          <button onClick={addItem} className="p-1.5 rounded-lg transition-all text-white" style={{ backgroundColor: 'var(--theme-primary)' }}>
            <FiPlus size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl relative group">
              <button
                onClick={() => removeItem(idx)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <FiTrash2 size={10} />
              </button>
              <div className="space-y-2">
                {itemFields.map(f => {
                  const isPath = isPathField(f.key);

                  return (
                    <div key={f.key}>
                      <label className="text-[8px] font-semibold text-gray-400 ml-1 mb-1 block">{f.label}</label>
                      {isPath ? (
                        <EliteSearchSelect
                          value={item[f.key] || ''}
                          availablePaths={availablePaths}
                          onChange={(val) => {
                            const updates = { [f.key]: val };
                            const labelField = itemFields.find(field => field.key === 'header' || field.key === 'label');
                            if (labelField && !item[labelField.key]) {
                              const suggestedLabel = val.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                              updates[labelField.key] = suggestedLabel;
                            }
                            const newItems = [...items];
                            newItems[idx] = { ...newItems[idx], ...updates };
                            updateProp(prop, newItems);
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={item[f.key] || ''}
                          onChange={(e) => updateItem(idx, f.key, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const devices = [
    { id: 'desktop', icon: FiMonitor, label: 'Desktop' },
    { id: 'tablet', icon: FiTablet, label: 'Tablet' },
    { id: 'mobile', icon: FiSmartphone, label: 'Mobile' }
  ];

  return isEnabled && selected ? (
    <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col h-full shadow-sm animate-in fade-in slide-in-from-right-4 duration-300 relative">
      {/* Device Switcher Header: Exclusive to Enterprise Divs */}
      {selected.name === 'CraftContainer' && (
        <div className="p-2 bg-gray-50/50 border-b border-gray-100">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => setActiveDevice(device.id)}
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-xl transition-all ${
                  activeDevice === device.id
                    ? 'bg-[var(--theme-primary)] text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <device.icon size={14} />
                <span className="ml-2 text-[9px] font-semibold hidden lg:block">{device.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-b border-[var(--theme-primary)]/10 sticky top-0 z-10" style={{ backgroundColor: 'var(--theme-secondary)' }}>
        <h2 className="text-[10px] font-semibold flex items-center gap-2" style={{ color: 'var(--theme-primary)' }}>
          <FiSettings className="w-3 h-3" />
          Elite Configuration
        </h2>
        <p className="text-[9px] text-gray-400 mt-1 font-medium">Selected: {selected.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Core Settings */}
        <div className="space-y-4">
          <label className="block text-[12px] font-semibold text-gray-400 mb-4">Core Metadata</label>

          {Object.keys(selected.props).map((prop) => {
            // Skip breakpoint-specific keys in the main list
            if (['Tablet', 'Mobile'].some(suffix => prop.endsWith(suffix))) return null;
            
            // Enterprise Protocol: Hide titles for structural containers
            if (selected.name === 'CraftContainer' && (prop === 'title' || prop === 'subtitle')) return null;

            if (prop === 'columns') return renderArrayEditor('columns', 'Table Columns', [{ key: 'header', label: 'Header', default: 'New Col' }, { key: 'bind', label: 'Data Path', default: 'path' }]);
            if (prop === 'fields') {
              const isCard = selected.name === 'CraftCard';
              return renderArrayEditor(
                'fields',
                isCard ? 'Card Data Mapping' : 'Form Fields',
                isCard
                  ? [{ key: 'label', label: 'Label', default: 'New Field' }, { key: 'bind', label: 'Data Path', default: 'path' }]
                  : [{ key: 'label', label: 'Label', default: 'New Field' }, { key: 'name', label: 'ID Key', default: 'field_name' }, { key: 'type', label: 'Type', default: 'text' }]
              );
            }
            // Skip styling props here, they go in the specialized sections
            if (['width', 'height', 'maxWidth', 'minWidth', 'padding', 'margin', 'backgroundColor', 'borderRadius', 'borderWidth', 'borderStyle', 'borderColor', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'showIcon', 'iconSize'].includes(prop)) return null;
            if (Array.isArray(selected.props[prop])) return null;
            if (prop === 'icon') {
              const showIcon = selected.props.showIcon !== false;
              return (
                <div key="icon-infrastructure" className="space-y-4 pt-4 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="flex justify-between items-center group">
                    <label className="text-[10px] font-semibold text-slate-900 group-hover:text-[var(--theme-primary)] transition-colors">Icon Infrastructure</label>
                    <div 
                      onClick={() => updateProp('showIcon', !showIcon)}
                      className={`w-9 h-5 rounded-full relative cursor-pointer transition-all duration-500 ${showIcon ? 'bg-[var(--theme-primary)] shadow-lg shadow-[var(--theme-primary)]/20' : 'bg-gray-200'}`}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ x: showIcon ? 18 : 3 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-md"
                      />
                    </div>
                  </div>
                  
                  <div className={`space-y-4 transition-all duration-500 ${!showIcon ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
                    {renderSimpleInput('icon', 'Library Selector')}
                    <div className="grid grid-cols-2 gap-4">
                      {renderSimpleInput('iconSize', 'Icon Scale')}
                    </div>
                  </div>
                </div>
              );
            }
            if (prop === 'showIcon' || prop === 'iconSize') return null; // Handled in the elite group
            
            // Intelligent Layout Governance: Hide noStack if flexWrap is already wrapping
            if (prop === 'noStack' && selected.props.flexWrap === 'wrap') return null;

            return renderSimpleInput(prop);
          })}
        </div>

        {/* Specialized Box Model for Containers */}
        {selected.name === 'CraftContainer' && (
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Dimensions & Geometry</label>
              <div className="space-y-4">
                {renderSimpleInput('maxWidth', 'Max Width (Enforced)')}
                {renderSimpleInput('minWidth', 'Min Width (Minimum)')}
                <div className="h-[1px] bg-gray-50 my-2" />
                {renderSimpleInput('width', 'Width')}
                {renderSimpleInput('height', 'Height')}
              </div>
              <div className="space-y-4">
                {renderSimpleInput('borderRadius', 'Radius')}
                {renderSimpleInput('backgroundColor', 'BG Color')}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Spacing Protocol</label>
              <div className="space-y-4">
                {renderSimpleInput('padding', 'Padding')}
                {renderSimpleInput('margin', 'Margin')}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Border Infrastructure</label>
              <div className="space-y-4">
                {renderSimpleInput('borderWidth', 'Width')}
                {renderSimpleInput('borderStyle', 'Style')}
              </div>
              {renderSimpleInput('borderColor', 'Border Color')}
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Flex Layout Engine</label>
              <div className="grid grid-cols-2 gap-4">
                {renderSimpleInput('flexDirection', 'Layout Direction')}
                {renderSimpleInput('gap', 'Gap Spacing')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderSimpleInput('alignItems', 'Item Distribution')}
                {renderSimpleInput('justifyContent', 'Axis Alignment')}
              </div>
              {renderSimpleInput('flexWrap', 'Reflow Policy')}
            </div>
          </div>
        )}

        {/* Specialized Box Model for Buttons */}
        {selected.name === 'CraftButton' && (
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Action Architecture</label>
              <div className="space-y-4">
                {renderSimpleInput('label', 'Action Label')}
                {renderSimpleInput('maxWidth', 'Max Width (Enforced)')}
                {renderSimpleInput('minWidth', 'Min Width (Minimum)')}
                <div className="grid grid-cols-2 gap-4">
                  {renderSimpleInput('fullWidth', 'Full Width Mode')}
                  {renderSimpleInput('flexWrap', 'Content Wrapping')}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Visual Branding</label>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderSimpleInput('variant', 'Style Variant')}
                  {renderSimpleInput('color', 'Prime Color')}
                </div>
                {renderSimpleInput('borderRadius', 'Button Radius')}
                <div className="grid grid-cols-2 gap-4">
                  {renderSimpleInput('borderWidth', 'Border Width')}
                  {renderSimpleInput('borderColor', 'Border Color')}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Action Logistics</label>
              <div className="space-y-4">
                {renderSimpleInput('targetRoute', 'Target Routing')}
                {renderSimpleInput('alignment', 'Button Alignment')}
                <div className="grid grid-cols-2 gap-4">
                  {renderSimpleInput('padding', 'Padding')}
                  {renderSimpleInput('margin', 'Margin')}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-semibold text-slate-900">Typography & Iconography</label>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderSimpleInput('fontSize', 'Font Scale')}
                  {renderSimpleInput('fontWeight', 'Weight')}
                </div>
                {renderSimpleInput('textColor', 'Label Color')}
                <div className="pt-2 border-t border-gray-50 space-y-4">
                  {renderSimpleInput('showIcon', 'Icon Visibility')}
                  <div className="grid grid-cols-2 gap-4">
                    {renderSimpleInput('icon', 'Icon Selection')}
                    {renderSimpleInput('iconSize', 'Icon Scale')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-6 bg-gray-50/50">
        <button
          onClick={() => {
            if (selected?.id) {
              actions.selectNode(null);
              actions.delete(selected.id);
            }
          }}
          className="w-full py-3 bg-rose-50 text-rose-600 text-[10px] font-semibold rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
        >
          Remove Component
        </button>
      </div>
    </div>
  ) : (
    <div className="w-[380px] bg-white border-l border-gray-100 flex flex-col items-center justify-center p-12 text-center opacity-30">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
        <FiMousePointer className="w-6 h-6" />
      </div>
      <p className="text-xs font-semibold text-gray-300">Select a component to configure its elite properties</p>
    </div>
  );
};
