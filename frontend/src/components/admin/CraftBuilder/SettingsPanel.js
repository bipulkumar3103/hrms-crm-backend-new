import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { FiSettings, FiMousePointer, FiPlus, FiTrash2, FiSearch, FiCheck, FiCopy, FiChevronDown, FiXCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../utils/api';

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

const EliteSearchSelect = ({ value, onChange, placeholder = "Select a data path...", availablePaths = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const hasPaths = availablePaths.length > 0;

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-2xl text-xs font-bold transition-all cursor-pointer flex justify-between items-center group
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
                <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-1.5">No structure discovered</p>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Enter an API endpoint in the <span className="text-[var(--theme-primary)] font-bold">DataSource</span> field and click the <span className="text-[var(--theme-primary)] font-bold">Search</span> icon to populate this list.
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
                      className="w-full pl-8 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none"
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
                        className={`w-full text-left p-3 rounded-xl transition-all hover:bg-gray-50/80 group flex flex-col space-y-1
                          ${value === meta.path ? 'bg-[var(--theme-secondary)]/30' : ''}
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] font-bold ${value === meta.path ? 'text-[var(--theme-primary)]' : 'text-gray-700'}`}>{meta.path}</span>
                          <span className="text-[9px] font-black uppercase text-gray-300 group-hover:text-[var(--theme-primary)] transition-colors opacity-60 tracking-widest">{meta.type}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate font-medium flex items-center gap-1.5 italic opacity-80">
                          <span className="text-[var(--theme-primary)] not-italic opacity-40 font-black">❯</span> {meta.sample}
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
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [scanFeedback, setScanFeedback] = useState(null);

  const updateProp = (key, value) => {
    actions.setProp(selected.id, (props) => {
      props[key] = value;
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
    const value = selected.props[prop] || '';

    return (
      <div key={prop} className="space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label || prop}</label>
          {isDataSource && (
            <button 
              onClick={handleScanAPI}
              disabled={isScanning || !value}
              className="text-[10px] font-bold text-[var(--theme-primary)] hover:underline flex items-center gap-1 disabled:opacity-30 transition-all"
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
              <p className="px-3 text-[9px] font-medium text-gray-400 italic">Connected to: <span className="text-[var(--theme-primary)] not-italic font-bold">{value}</span></p>
            )}
          </div>
        ) : (
          <div className="relative">
            <input 
              type="text" 
              value={value} 
              onChange={(e) => updateProp(prop, e.target.value)}
              placeholder={isDataSource ? "/api/v1/endpoint" : "Enter value..."}
              className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white transition-all outline-none ${isDataSource ? 'pr-10' : ''}`}
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
          <div className="mt-2 space-y-2 px-1">
            <AnimatePresence>
              {scanFeedback && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)]"
                >
                  <FiCheck className="animate-bounce" />
                  {scanFeedback}
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic opacity-80">
              Scan to discover dynamic paths like <span className="text-[var(--theme-primary)] font-bold not-italic">{"{{name}}"}</span> for your titles.
            </p>
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
          <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--theme-primary)' }}>{label}</label>
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
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter ml-1 mb-1 block">{f.label}</label>
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
                          className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
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

  return isEnabled && selected ? (
    <div className="w-[380px] bg-white border-l border-gray-100 flex flex-col h-full shadow-sm animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden">
      <div className="p-8 border-b border-gray-50" style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.2 }}>
        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--theme-primary)' }}>
          <FiSettings className="w-4 h-4" />
          Elite Configuration
        </h2>
        <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-tighter">Selected: {selected.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Core Settings */}
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Core Metadata</label>
          
          {Object.keys(selected.props).map((prop) => {
            if (prop === 'columns') return renderArrayEditor('columns', 'Table Columns', [{key: 'header', label: 'Header', default: 'New Col'}, {key: 'bind', label: 'Data Path', default: 'path'}]);
            if (prop === 'fields') {
              const isCard = selected.name === 'CraftCard';
              return renderArrayEditor(
                'fields', 
                isCard ? 'Card Data Mapping' : 'Form Fields', 
                isCard 
                  ? [{key: 'label', label: 'Label', default: 'New Field'}, {key: 'bind', label: 'Data Path', default: 'path'}]
                  : [{key: 'label', label: 'Label', default: 'New Field'}, {key: 'name', label: 'ID Key', default: 'field_name'}, {key: 'type', label: 'Type', default: 'text'}]
              );
            }
            // Skip styling props here, they go in the specialized sections
            if (['width', 'height', 'padding', 'margin', 'backgroundColor', 'borderRadius', 'borderWidth', 'borderStyle', 'borderColor', 'flexDirection', 'alignItems', 'justifyContent', 'gap'].includes(prop)) return null;
            if (Array.isArray(selected.props[prop])) return null;
            return renderSimpleInput(prop);
          })}
        </div>

        {/* Specialized Box Model for Containers */}
        {selected.name === 'CraftContainer' && (
          <div className="space-y-6 pt-6 border-t border-gray-100">
             <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Dimensions & Geometry</label>
                <div className="grid grid-cols-2 gap-4">
                   {renderSimpleInput('width', 'Width')}
                   {renderSimpleInput('height', 'Height')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   {renderSimpleInput('borderRadius', 'Radius')}
                   {renderSimpleInput('backgroundColor', 'BG Color')}
                </div>
             </div>

             <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Spacing Protocol</label>
                <div className="grid grid-cols-2 gap-4">
                   {renderSimpleInput('padding', 'Padding')}
                   {renderSimpleInput('margin', 'Margin')}
                </div>
             </div>

             <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Border Infrastructure</label>
                <div className="grid grid-cols-2 gap-4">
                   {renderSimpleInput('borderWidth', 'Width')}
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Style</label>
                      <select 
                        value={selected.props.borderStyle || 'solid'} 
                        onChange={(e) => updateProp('borderStyle', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none uppercase appearance-none"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="none">None</option>
                      </select>
                   </div>
                </div>
                {renderSimpleInput('borderColor', 'Border Color')}
             </div>

             <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Flex Layout Engine</label>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Direction</label>
                      <select 
                        value={selected.props.flexDirection || 'column'} 
                        onChange={(e) => updateProp('flexDirection', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none uppercase appearance-none"
                      >
                        <option value="column">Vertical</option>
                        <option value="row">Horizontal</option>
                      </select>
                   </div>
                   {renderSimpleInput('gap', 'Gap Spacing')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Alignment</label>
                      <select 
                        value={selected.props.alignItems || 'stretch'} 
                        onChange={(e) => updateProp('alignItems', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none uppercase appearance-none"
                      >
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                        <option value="stretch">Stretch</option>
                      </select>
                   </div>
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Justification</label>
                      <select 
                        value={selected.props.justifyContent || 'flex-start'} 
                        onChange={(e) => updateProp('justifyContent', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none uppercase appearance-none"
                      >
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                        <option value="space-between">Between</option>
                        <option value="space-around">Around</option>
                      </select>
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
          className="w-full py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
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
      <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Select a component to configure its elite properties</p>
    </div>
  );
};
