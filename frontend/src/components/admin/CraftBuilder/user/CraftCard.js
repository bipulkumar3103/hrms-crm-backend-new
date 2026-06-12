import React, { useState, useEffect } from 'react';
import { useNode, Element as CraftElement } from '@craftjs/core';
import { api } from '../../../../utils/api';
import { resolveDynamicString } from '../../../DynamicUIRenderer/SchemaEngine';
import { FiMaximize } from 'react-icons/fi';

export const CraftCard = ({ 
  title, subtitle, padding = '24px', borderRadius = '32px', backgroundColor = 'white', dataSource, 
  flexWrap = 'nowrap', noStack = false,  display = 'block', 
  width = '100%',
  maxWidth = 'auto',
  minWidth = 'auto',
  height = 'auto',
  margin = '0px',
  borderWidth = '1px',
  borderStyle = 'solid',
  borderColor = 'gray-100',
  // Breakpoint Overrides
  widthTablet, widthMobile,
  paddingTablet, paddingMobile,
  displayTablet, displayMobile,
  maxWidthTablet, maxWidthMobile,
  minWidthTablet, minWidthMobile,
  heightTablet, heightMobile,
  marginTablet, marginMobile,
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

  // Universal Theme Resolution Engine
  const resolveColor = (val) => {
    if (!val || val === 'transparent') return 'transparent';
    const isHex = val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
    if (isHex) return val;
    
    const presets = {
      white: '#ffffff',
      black: '#000000',
      'gray-50': '#f9fafb',
      'gray-100': '#f3f4f6'
    };

    if (presets[val.toLowerCase()]) return presets[val.toLowerCase()];
    return `var(--theme-${val.replace('theme-', '')})`;
  };

  const resolvedTitle = resolveDynamicString(title, data);
  const resolvedSubtitle = resolveDynamicString(subtitle, data);

  const cardStyle = {
    backgroundColor: resolveColor(backgroundColor),
    borderRadius: borderRadius || '32px',
    borderWidth,
    borderStyle,
    borderColor: resolveColor(borderColor),
    padding: 'var(--padding)',
    display: 'var(--display)',
    margin: 'var(--margin)',
    width: 'var(--width)',
    height: 'var(--height)',
    minHeight: height === 'auto' ? 'auto' : 'var(--height)',
    maxWidth: 'var(--max-width)',
    minWidth: 'var(--min-width)',
    boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    transition: 'all 0.3s ease',
    
    // Elite Breakpoint Variable Mapping
    '--width': width,
    '--width-tablet': widthTablet || width,
    '--width-mobile': widthMobile || widthTablet || width,
    '--padding': padding,
    '--padding-tablet': paddingTablet || padding,
    '--padding-mobile': paddingMobile || paddingTablet || padding,
    '--margin': margin,
    '--margin-tablet': marginTablet || margin,
    '--margin-mobile': marginMobile || marginTablet || margin,
    '--display': display,
    '--display-tablet': displayTablet || display,
    '--display-mobile': displayMobile || displayTablet || display,
    '--max-width': maxWidth,
    '--max-width-tablet': maxWidthTablet || maxWidth,
    '--max-width-mobile': maxWidthMobile || maxWidthTablet || maxWidth,
    '--min-width': minWidth,
    '--min-width-tablet': minWidthTablet || minWidth,
    '--min-width-mobile': minWidthMobile || minWidthTablet || minWidth,
    '--height': height,
    '--height-tablet': heightTablet || height,
    '--height-mobile': heightMobile || heightTablet || height,
  };

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      className="mb-6 transition-all duration-300 elite-responsive group/card relative"
      style={cardStyle}
    >
      <div className="mb-6 flex justify-between items-start">
        <div>
           <h4 className="text-xl font-bold text-gray-900 tracking-tight mb-1">{resolvedTitle}</h4>
           <p className="text-xs text-gray-400 font-medium">{resolvedSubtitle}</p>
        </div>
      </div>

      {/* Field Discovery Logic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {(props.fields || []).map((field, idx) => {
          const path = field.bind || field.path || field.name;
          const value = resolveDynamicString(`{{${path}}}`, data);
          return (
            <div key={idx} className="p-4 bg-gray-50/30 border border-gray-50 rounded-2xl transition-all hover:bg-white hover:shadow-sm">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{field.label}</label>
              <div className="text-sm font-semibold text-gray-800">
                {value === `{{${path}}}` ? '---' : value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recursive children slot */}
      <div className="relative z-10 pt-4 border-t border-gray-50 mt-4">
        <CraftElement id="card-content" is="div" className="flex-1" canvas>
          {children || (
            <div 
              className="min-h-[60px] border-2 border-dashed rounded-2xl flex items-center justify-center text-gray-300 text-[10px] font-bold bg-gray-50/10 uppercase tracking-[0.2em]"
              style={{ borderColor: 'var(--theme-secondary)', opacity: 0.3 }}
            >
              Element Drop Zone
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
    backgroundColor: 'white',
    dataSource: '',
    fields: [],
    noStack: false,
    display: 'block',
    maxWidth: 'auto',
    minWidth: 'auto',
    height: 'auto',
    margin: '0px 0px 24px 0px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'gray-100',
    // Breakpoint Defaults
    displayTablet: undefined, displayMobile: undefined,
    maxWidthTablet: undefined, maxWidthMobile: undefined,
    minWidthTablet: undefined, minWidthMobile: undefined,
    heightTablet: undefined, heightMobile: undefined,
    marginTablet: undefined, marginMobile: undefined,
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
