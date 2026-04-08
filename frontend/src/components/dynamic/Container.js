import React from 'react';

const resolveColor = (val) => {
  if (!val || val === 'transparent') return 'transparent';
  const isHex = val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
  if (isHex) return val;
  
  const presets = {
    white: '#ffffff',
    black: '#000000',
    'gray-50': '#f9fafb',
    'gray-100': '#f3f4f6',
    'gray-200': '#e5e7eb',
    'gray-300': '#d1d5db',
    'gray-400': '#9ca3af',
    'gray-500': '#6b7280',
    'gray-600': '#4b5563',
    'gray-700': '#374151',
    'gray-800': '#1f2937',
    'gray-900': '#111827',
  };

  if (presets[val.toLowerCase()]) return presets[val.toLowerCase()];
  return `var(--theme-${val.replace('theme-', '')})`;
};

const toMetric = (val) => {
  if (val === null || val === undefined || val === '') return undefined;
  if (!isNaN(val) && typeof val !== 'boolean') return `${val}px`;
  return val;
};

const Container = ({ children, config }) => {
  const {
    width = "100%",
    height = "auto",
    padding = 20,
    margin = 0,
    backgroundColor = "white",
    borderWidth = 2,
    borderStyle = "dashed",
    borderColor = "gray-100",
    flexDirection = "row",
    alignItems = 'stretch',
    justifyContent = 'flex-start',
    gap = 16,
    flexWrap = "nowrap",
    borderRadius = 24,
    boxShadow = "none",
    noStack = false,
    // Breakpoint Overrides
    widthTablet, widthMobile,
    heightTablet, heightMobile,
    paddingTablet, paddingMobile,
    flexDirectionTablet, flexDirectionMobile,
    gapTablet, gapMobile,
  } = config || {};

  const style = {
    backgroundColor: resolveColor(backgroundColor),
    borderRadius: toMetric(borderRadius),
    borderWidth: toMetric(borderWidth),
    borderStyle,
    borderColor: resolveColor(borderColor),
    boxSizing: 'border-box',
    // Elite Breakpoint Variable Mapping
    '--width': toMetric(width),
    '--width-tablet': toMetric(widthTablet || width),
    '--width-mobile': toMetric(widthMobile || widthTablet || width),
    '--height': toMetric(height),
    '--padding': toMetric(padding),
    '--display': 'flex',
    '--flex-direction': flexDirection,
    '--flex-direction-tablet': flexDirectionTablet || flexDirection,
    '--flex-direction-mobile': noStack ? (flexDirectionMobile || flexDirectionTablet || flexDirection) : 'column',
    '--gap': toMetric(gap),
    '--gap-tablet': toMetric(gapTablet || gap),
    '--gap-mobile': toMetric(gapMobile || gapTablet || gap),
    '--flex-wrap': flexWrap,
    '--flex-wrap-mobile': noStack ? flexWrap : 'wrap',
    '--align-items': alignItems,
    '--justify-content': justifyContent,
  };

  return (
    <div style={style} className="elite-responsive elite-container relative group/container">
      {children}
    </div>
  );
};

export default Container;
