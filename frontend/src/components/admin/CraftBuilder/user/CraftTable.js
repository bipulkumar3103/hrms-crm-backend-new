import React, { useState, useEffect, useMemo } from 'react';
import { useNode } from '@craftjs/core';
import { api } from '../../../../utils/api';
import { FiCalendar, FiBox, FiCheckCircle, FiMoreVertical, FiAlertCircle, FiUser } from 'react-icons/fi';

/* Universal Cell Formatter (Replicated from original Table.js) */
const UniversalCell = ({ value, path }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-300 font-medium italic text-[11px]">Not Specified</span>;
  }

  const isImage = (typeof value === 'string' && (
    value.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) || 
    value.includes('avatar') || 
    path?.includes('avatar') || 
    path?.includes('image') ||
    path?.includes('logo')
  ));
  
  if (isImage) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shadow-sm">
        <img 
          src={value} 
          alt="Data" 
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Data&background=f3f4f6&color=94a3b8'; }}
        />
      </div>
    );
  }

  const isStatus = path?.toLowerCase().includes('status') || path?.toLowerCase().includes('state');
  if (isStatus) {
    const status = String(value).toLowerCase();
    let config = { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    if (['inactive', 'failed', 'rejected'].includes(status)) {
      config = { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' };
    } else if (['pending', 'waiting'].includes(status)) {
      config = { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${config.bg} ${config.text} border border-current opacity-80`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-2`}></span>
        {value}
      </span>
    );
  }

  const isDate = typeof value === 'string' && (value.match(/^\d{4}/) || path?.includes('date') || path?.includes('at'));
  if (isDate) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return (
          <div className="flex items-center text-gray-600 text-[13px]">
            <FiCalendar className="mr-2 opacity-40" />
            <span className="font-medium">{date.toLocaleDateString()}</span>
          </div>
        );
      }
    } catch {}
  }

  return <span className="text-gray-800 font-medium tracking-tight text-[13px]">{String(value)}</span>;
};

export const CraftTable = ({ title, dataSource, columns = [], ...props }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dataSource) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Normalize URL logic
        let url = dataSource.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/?api\/v1/, '');
        if (!url.startsWith('/')) url = '/' + url;
        
        const res = await api.get(url);
        let list = Array.isArray(res.data) ? res.data : [];
        if (!Array.isArray(res.data) && res.data && typeof res.data === 'object') {
            const key = ['employees', 'users', 'results', 'data', 'items'].find(k => Array.isArray(res.data[k]));
            list = key ? res.data[key] : [res.data];
        }
        setData(list.slice(0, 5)); // Limit to 5 for editor performance
      } catch (e) {
        console.error("CraftTable fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dataSource]);

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      className={`bg-white border-2 overflow-hidden mb-8 transition-all rounded-[2rem] ${selected ? 'border-[var(--theme-primary)]' : 'border-gray-100 hover:border-gray-200'}`}
      style={{ 
        boxShadow: selected ? `0 10px 30px rgba(0,0,0,0.08)` : 'none',
      }}
    >
      <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-white">
        <div>
           <h3 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center">
             <FiBox className="mr-4" size={24} style={{ color: 'var(--theme-primary)' }}/>
             {title || 'Smart Data Entity'}
           </h3>
           <p className="text-[11px] text-gray-400 font-semibold mt-1.5 ml-10 italic">
             {loading ? 'Synchronizing Remote Stream...' : `Active Node Instance: ${dataSource || 'None Linked'}`}
           </p>
        </div>
        <button className="w-10 h-10 bg-gray-50 text-gray-400 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] rounded-2xl flex items-center justify-center transition-all">
          <FiMoreVertical size={20}/>
        </button>
      </div>

      <div className="overflow-x-auto p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/30">
              {(columns.length > 0 ? columns : [{header: 'Property', bind: 'name'}, {header: 'Attribute', bind: 'email'}]).map((col, idx) => (
                <th key={idx} className="px-10 py-5 text-left text-[11px] font-semibold text-gray-400 border-b border-gray-50">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
               <tr>
                 <td colSpan={columns.length || 2} className="px-10 py-16 text-center">
                   <div className="flex flex-col items-center opacity-20">
                     <FiBox size={48} className="mb-4" />
                     <p className="text-xs font-semibold">No Active Records Detected</p>
                   </div>
                 </td>
               </tr>
            ) : (
                data.map((row, rowIdx) => (
                <tr key={rowIdx} className="group transition-all duration-300" style={{ hoverBackgroundColor: 'var(--theme-secondary)', opacity: 0.8 }}>
                  {(columns.length > 0 ? columns : [{header: 'Property', bind: 'name'}, {header: 'Attribute', bind: 'email'}]).map((col, colIdx) => {
                    const value = col.bind?.split('.').reduce((o, p) => (o ? o[p] : null), row);
                    return (
                      <td key={colIdx} className="px-10 py-6 transition-all duration-300">
                         <UniversalCell value={value} path={col.bind} />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

CraftTable.craft = {
  props: {
    title: 'Employee Ledger (Smart)',
    dataSource: '/api/v1/employees',
    columns: [
        { header: "Personnel", bind: "name" },
        { header: "Contact Integration", bind: "email" },
        { header: "Role Permission", bind: "role" }
    ],
  },
  rules: {
    canDrag: () => true,
  },
};
