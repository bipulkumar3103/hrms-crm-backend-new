import React, { useState, useEffect } from 'react';
import { useNode, Element as CraftElement } from '@craftjs/core';
import { api } from '../../../../utils/api';
import { resolveDynamicString } from '../../../DynamicUIRenderer/SchemaEngine';

export const CraftCard = ({ 
  title, subtitle, padding = '24px', borderRadius = '32px', background = 'white', dataSource, 
  flexWrap = 'nowrap', noStack = false, display = 'block', 
  // Breakpoint Overrides
  widthTablet, widthMobile,
  paddingTablet, paddingMobile,
  displayTablet, displayMobile,
  children, ...props 
}) => {
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
      className={`p-6 mb-6 transition-all duration-300 shadow-sm border border-gray-100 elite-responsive ${selected ? 'bg-gray-50/5' : 'bg-white hover:shadow-md'}`}
      style={{ 
        padding,
        borderRadius: borderRadius || '32px',
        display,
        boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : 'none',
        // Elite Breakpoint Variable Mapping
        '--padding': padding,
        '--padding-tablet': paddingTablet || padding,
        '--padding-mobile': paddingMobile || paddingTablet || padding,
        '--display': display,
        '--display-tablet': displayTablet || display,
        '--display-mobile': displayMobile || displayTablet || display,
        '--width-tablet': widthTablet,
        '--width-mobile': widthMobile,
      }}
    >
      {/* Recursive children slot */}
      <div className="relative z-10">
        <CraftElement id="card-content" is="div" className="flex-1" canvas>
          {children || (
            <div 
              className="min-h-[100px] border-2 border-dashed rounded-2xl flex items-center justify-center text-gray-300 text-xs font-semibold bg-gray-50/50"
              style={{ borderColor: 'var(--theme-secondary)', opacity: 0.3 }}
            >
              Data Nest Ready
            </div>
          )}
        </CraftElement>
      </div>
    </div>
  );
};

CraftCard.craft = {
  props: {
    title: 'Enterprise Analytics Card',
    subtitle: 'Real-time monitoring and reporting.',
    padding: '24px',
    borderRadius: '32px',
    dataSource: '',
    fields: [],
    flexWrap: 'nowrap',
    noStack: false,
    display: 'block',
    // Breakpoint Defaults
    widthTablet: undefined, widthMobile: undefined,
    paddingTablet: undefined, paddingMobile: undefined,
    displayTablet: undefined, displayMobile: undefined,
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
