import React, { useState, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { api } from '../../../../utils/api';
import { resolveDynamicString } from '../../../DynamicUIRenderer/SchemaEngine';

export const CraftCard = ({ title, subtitle, padding = '1.5rem', background = 'white', dataSource, children, ...props }) => {
  const [data, setData] = useState(null);
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  useEffect(() => {
    if (dataSource) {
      const fetchData = async () => {
        try {
          let url = dataSource.trim().replace(/^https?:\/\/[^\/]+/, '').replace(/^\/?api\/v1/, '');
          if (!url.startsWith('/')) url = '/' + url;
          const res = await api.get(url);
          // Handle both arrays (take first item) and single objects
          const result = Array.isArray(res.data) ? res.data[0] : res.data;
          setData(result);
        } catch (err) {
          console.warn('Card failed to fetch context data', err);
        }
      };
      fetchData();
    }
  }, [dataSource]);

  const resolvedTitle = resolveDynamicString(title, data);
  const resolvedSubtitle = resolveDynamicString(subtitle, data);

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      className={`p-6 mb-6 transition-all duration-300 shadow-sm border border-gray-100 rounded-3xl ${selected ? 'bg-gray-50/5' : 'bg-white hover:shadow-md'}`}
      style={{ 
        padding,
        boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : 'none'
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{resolvedTitle || "Card Container"}</h3>
          <p className="text-sm text-gray-400 mt-1 font-medium">{resolvedSubtitle || "Manage data fields here."}</p>
        </div>
      </div>
      {/* Recursive children slot */}
      <div className="min-h-[60px]">
        {children || (
          <div 
            className="min-h-[100px] border-2 border-dashed rounded-2xl flex items-center justify-center text-gray-300 text-xs font-bold uppercase tracking-widest bg-gray-50/50"
            style={{ borderColor: 'var(--theme-secondary)', opacity: 0.3 }}
          >
            Data Nest Ready
          </div>
        )}
      </div>
    </div>
  );
};

CraftCard.craft = {
  props: {
    title: 'Enterprise Analytics Card',
    subtitle: 'Real-time monitoring and reporting.',
    padding: '1.5rem',
    dataSource: '',
    fields: [],
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
