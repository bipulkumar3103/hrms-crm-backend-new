import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { FiAlertCircle, FiUser, FiMoreVertical, FiCalendar, FiBox, FiCheckCircle, FiXCircle } from 'react-icons/fi';

/**
 * UniversalCell component handles automatic type-detection and formatting
 * for any given data type (Images, Badges, Dates, etc.)
 */
const UniversalCell = ({ value, path, row }) => {
  // 1. Handle Null/Undefined
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-300 font-medium italic text-[11px]">Not Specified</span>;
  }

  // 2. Handle Images (Avatars/Logos)
  const isImage = (typeof value === 'string' && (
    value.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) || 
    value.includes('avatar') || 
    path.includes('avatar') || 
    path.includes('image') ||
    path.includes('logo')
  ));
  
  if (isImage) {
    return (
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
          <img 
            src={value} 
            alt="Cell Data" 
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Data&background=f3f4f6&color=94a3b8'; }}
          />
        </div>
      </div>
    );
  }

  // 3. Handle Statuses (Role-based colors)
  const isStatus = path.toLowerCase().includes('status') || path.toLowerCase().includes('state');
  if (isStatus) {
    const status = String(value).toLowerCase();
    let config = { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    
    if (['active', 'success', 'completed', 'verified', 'standard employee'].includes(status)) {
      config = { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    } else if (['inactive', 'failed', 'error', 'rejected', 'deleted'].includes(status)) {
      config = { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' };
    } else if (['pending', 'waiting', 'invited', 'onboarding'].includes(status)) {
      config = { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${config.bg} ${config.text} border border-current opacity-80`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-2 animate-pulse`}></span>
        {value}
      </span>
    );
  }

  // 4. Handle Arrays (Tags)
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // 5. Handle Objects (Recursive Label discovery)
  if (typeof value === 'object') {
    const label = value.name || value.title || value.label || value.id || 'Complex Object';
    return <span className="text-gray-700 font-medium">{String(label)}</span>;
  }

  // 6. Handle Dates
  const isDate = typeof value === 'string' && (
      value.match(/^\d{4}-\d{2}-\d{2}/) || 
      path.includes('date') || 
      path.includes('at') || 
      path.includes('dob')
  );
  if (isDate) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return (
          <div className="flex items-center text-gray-600">
            <FiCalendar className="mr-2 opacity-40" />
            <span className="font-medium">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        );
      }
    } catch {}
  }

  // Default: Plain Text
  return <span className="text-gray-800 font-medium tracking-tight whitespace-nowrap">{String(value)}</span>;
};

/**
 * The Universal Dynamic Table component.
 * Features: Deep discovery, auto-formatting, type-aware cells, and premium UI.
 */
function Table({ config, token, providedData }) {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Normalization logic for dataSource URLs
  const normalizedUrl = useMemo(() => {
    if (!config.dataSource) return null;
    let url = config.dataSource.trim();
    
    // 1. Strip domain if present
    url = url.replace(/^https?:\/\/[^\/]+/, ''); 
    
    // 2. Aggressively remove /api/v1 or api/v1 prefix
    if (url.startsWith('/api/v1')) url = url.replace('/api/v1', '');
    else if (url.startsWith('api/v1')) url = url.replace('api/v1', '');
    
    // 3. Ensure single leading slash
    if (!url.startsWith('/')) url = '/' + url;
    
    return url;
  }, [config.dataSource]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Check for Provided Data (from parent)
      if (providedData) {
        console.log(`[UniversalTable] Using pre-fetched data for: ${config.title}`);
        setDataList(Array.isArray(providedData) ? providedData : [providedData]);
        setLoading(false);
        return;
      }

      if (!normalizedUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(normalizedUrl);
        let discoveredData = [];

        // --- Smart Data Discovery Engine ---
        if (Array.isArray(res.data)) {
          discoveredData = res.data;
        } else if (res.data && typeof res.data === 'object') {
          // If it's a single resource (User Profile, Company Profile), wrap it
          if (res.data.id || res.data.email || (res.data.name && !res.data.items)) {
            discoveredData = [res.data];
          } else {
            // Search for pluralized array keys
            const keyCandidates = ['employees', 'users', 'results', 'data', 'items', 'list'];
            const foundKey = keyCandidates.find(key => Array.isArray(res.data[key]));
            
            if (foundKey) {
              discoveredData = res.data[foundKey];
            } else {
              // Deep Search (Last Resort): Find first array that isn't 'roles' or 'permissions'
              const deepArray = Object.keys(res.data).find(k => 
                Array.isArray(res.data[k]) && !['roles', 'permissions'].includes(k)
              );
              discoveredData = deepArray ? res.data[deepArray] : [res.data];
            }
          }
        }

        console.log(`[UniversalTable] Discovered ${discoveredData.length} records from ${normalizedUrl}`);
        setDataList(discoveredData);
      } catch (err) {
        console.error(`[UniversalTable] Error fetching from ${normalizedUrl}:`, err);
        const msg = err.response?.data?.message || err.message || 'System connectivity issue';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [normalizedUrl, providedData, token, config.title]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl border border-gray-100 p-8 space-y-6 shadow-sm animate-pulse">
        <div className="h-6 w-1/4 bg-gray-100 rounded-lg"></div>
        <div className="space-y-4">
           {Array(3).fill(0).map((_, i) => (
             <div key={i} className="h-12 bg-gray-50 rounded-xl w-full"></div>
           ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full bg-rose-50 border border-rose-100 p-8 rounded-3xl flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <FiAlertCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-rose-900 mb-1">Data Retrieval Failure</h3>
        <p className="text-rose-600 text-[13px] font-medium max-w-xs">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-white border border-rose-200 text-rose-700 font-bold rounded-xl hover:bg-rose-100 transition-all shadow-sm"
        >
          Attempt Reconnection
        </button>
      </div>
    );
  }

  // Extract Style Config
  const style = config.style || {};
  const containerStyle = {
    borderColor: style.borderColor || '#e5e7eb',
    borderWidth: style.borderWidth || '1px',
    borderRadius: style.borderRadius || '26px'
  };

  const shadowClassMap = {
    'none': 'shadow-none',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };
  const shadowClass = shadowClassMap[style.shadow] || 'shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]';

  return (
    <div 
      className={`w-full bg-white border overflow-hidden mb-8 transition-all hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] ${shadowClass}`}
      style={containerStyle}
    >
      {/* Table Header */}
      <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
        <div>
           <h3 className="text-xl font-bold text-gray-800 tracking-tight flex items-center">
             <FiBox className="mr-3 opacity-60" style={{ color: style.borderColor || '#6366f1' }} size={20}/>
             {config.title || 'Dynamic Record Set'}
           </h3>
           <p className="text-[12px] text-gray-400 font-medium mt-0.5 ml-8 italic">Rendering {dataList.length} total entries from secure cloud.</p>
        </div>
        <button className="p-2.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
          <FiMoreVertical size={18}/>
        </button>
      </div>

      {/* Table Main */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              {config.columns?.filter(c => c && c.header).map((col, idx) => (
                <th key={idx} className="px-8 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] border-b border-gray-50">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {dataList.length === 0 ? (
              <tr>
                <td colSpan={config.columns?.length || 1} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                      <FiBox size={32}/>
                    </div>
                    <p className="text-gray-400 font-bold text-sm tracking-tight">Zero Records Located</p>
                    <p className="text-gray-300 text-[11px] mt-1">The request returned an empty data set from the server.</p>
                  </div>
                </td>
              </tr>
            ) : (
              dataList.map((row, rowIdx) => (
                <tr key={rowIdx} className="group hover:bg-indigo-50/30 transition-all duration-200 cursor-default">
                  {config.columns?.filter(c => c && c.header).map((col, colIdx) => {
                    const path = col.bind || '';
                    let value = path.split('.').reduce((o, p) => (o ? o[p] : null), row);

                    // --- Smart Resolver Fallback for Full Names ---
                    if ((value === null || value === undefined || value === '') && 
                        (path === 'name' || path === 'full_name' || path === 'user') && 
                        (row.first_name || row.last_name)) {
                      value = `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email;
                    }

                    return (
                      <td key={colIdx} className="px-8 py-5 group-hover:px-9 transition-all duration-300">
                         <UniversalCell value={value} path={path} row={row} />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

       {/* Footer Info */}
      <div className="px-8 py-5 flex justify-between items-center" style={{ backgroundColor: `${style.borderColor}08` || '#f9fafb' }}>
         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Autonomous Data Governance System</span>
         <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.borderColor || '#10b981', boxShadow: `0 0 8px ${style.borderColor}80` }}></span>
            <span className="text-[11px] font-bold" style={{ color: style.borderColor || '#059669' }}>Secure Link Active</span>
         </div>
      </div>
    </div>
  );
}

export default Table;
