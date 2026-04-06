import React, { useState, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import * as Icons from 'react-icons/fi';
import { api } from '../../../../utils/api';
import { resolveDynamicString } from '../../../DynamicUIRenderer/SchemaEngine';

export const CraftButton = ({ 
  label = 'Smart Action', 
  variant = 'solid', 
  color = 'primary', 
  size = 'md', 
  targetRoute = '', 
  icon = 'FiArrowRight', 
  dataSource = '',
  alignment = 'left',
  fullWidth = false,
  ...props 
}) => {
  const [data, setData] = useState(null);
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  // Smart Data Fetching (Matches CraftCard)
  useEffect(() => {
    if (dataSource) {
      const fetchData = async () => {
        try {
          let url = dataSource.trim().replace(/^https?:\/\/[^\/]+/, '').replace(/^\/?api\/v1/, '');
          if (!url.startsWith('/')) url = '/' + url;
          const res = await api.get(url);
          const result = Array.isArray(res.data) ? res.data[0] : res.data;
          setData(result);
        } catch (err) {
          console.warn('Smart Button failed to fetch context data', err);
        }
      };
      fetchData();
    }
  }, [dataSource]);

  const resolvedLabel = resolveDynamicString(label, data);
  const IconComponent = Icons[icon] || Icons.FiArrowRight;

  // Elite Styling Logic
  const getVariantClasses = () => {
    const base = "font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm";
    
    const sizeClasses = {
      sm: "px-4 py-2 text-[9px] rounded-xl",
      md: "px-6 py-3 text-[10px] rounded-2xl",
      lg: "px-8 py-4 text-[12px] rounded-3xl",
    };

    const colorMap = {
      primary: 'var(--theme-primary)',
      accent: '#6366f1',
      rose: '#f43f5e',
      amber: '#f59e0b',
    };

    const themeColor = colorMap[color] || colorMap.primary;

    const variantStyles = {
      solid: {
        backgroundColor: themeColor,
        color: 'white',
        border: 'none',
      },
      outline: {
        backgroundColor: 'transparent',
        color: themeColor,
        border: `2px solid ${themeColor}20`,
      },
      ghost: {
        backgroundColor: `${themeColor}10`,
        color: themeColor,
        border: 'none',
        boxShadow: 'none',
      }
    };

    return { 
      className: `${base} ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? 'w-full' : 'w-fit'}`, 
      style: { 
        ...variantStyles[variant] || variantStyles.solid,
        boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : variant === 'solid' ? '0 10px 25px -5px rgba(0,0,0,0.1)' : 'none'
      } 
    };
  };

  const styling = getVariantClasses();

  const handleNavigate = () => {
    if (enabled) return; // 🛑 Prevent redirect in Build Mode
    if (!targetRoute) return;
    
    // If it's a relative path and we are in a non-router app, 
    // we use window.location.href which might cause a reload
    // but at least it won't crash the app.
    if (targetRoute.startsWith('http')) {
      window.open(targetRoute, '_blank');
    } else {
      window.location.href = targetRoute;
    }
  };

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      className={`mb-4 flex items-center py-2 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}
    >
      <button 
        onClick={handleNavigate}
        className={styling.className}
        style={styling.style}
      >
        <span>{resolvedLabel}</span>
        {icon && <IconComponent size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />}
      </button>
    </div>
  );
};

CraftButton.craft = {
  props: {
    label: 'Smart Action',
    variant: 'solid',
    color: 'primary',
    size: 'md',
    targetRoute: '',
    icon: 'FiArrowRight',
    dataSource: '',
    alignment: 'left',
    fullWidth: false,
  },
  rules: {
    canDrag: () => true,
  },
};
