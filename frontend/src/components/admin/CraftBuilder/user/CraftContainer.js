import React from 'react';
import { useNode, Element } from '@craftjs/core';

export const CraftContainer = ({ 
  width = '100%', 
  height = 'auto',
  padding = '24px',
  margin = '0px',
  backgroundColor = 'white',
  borderRadius = '24px',
  borderWidth = '1px',
  borderStyle = 'none',
  borderColor = 'gray-100',
  flexDirection = 'column',
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  gap = '1rem',
  flexWrap = 'nowrap',
  noStack = false,
  display = 'flex',
  // Breakpoint Overrides
  widthTablet, widthMobile,
  heightTablet, heightMobile,
  paddingTablet, paddingMobile,
  marginTablet, marginMobile,
  gapTablet, gapMobile,
  flexDirectionTablet, flexDirectionMobile,
  displayTablet, displayMobile,
  children,
  ...props 
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

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

  const containerStyle = {
    backgroundColor: resolveColor(backgroundColor),
    borderRadius,
    borderWidth,
    borderStyle,
    borderColor: resolveColor(borderColor),
    transition: 'all 0.3s ease',
    position: 'relative',
    minHeight: height === 'auto' ? '120px' : height,
    boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : 'none',
    boxSizing: 'border-box',
    // Elite Breakpoint Variable Mapping
    '--width': width,
    '--width-tablet': widthTablet || width,
    '--width-mobile': widthMobile || widthTablet || width,
    '--height': height,
    '--height-tablet': heightTablet || height,
    '--height-mobile': heightMobile || heightTablet || height,
    '--padding': padding,
    '--padding-tablet': paddingTablet || padding,
    '--padding-mobile': paddingMobile || paddingTablet || padding,
    '--margin': margin,
    '--margin-tablet': marginTablet || margin,
    '--margin-mobile': marginMobile || marginTablet || margin,
    '--display': display,
    '--display-tablet': displayTablet || display,
    '--display-mobile': displayMobile || displayTablet || display,
    '--flex-direction': flexDirection,
    '--flex-direction-tablet': flexDirectionTablet || flexDirection,
    '--flex-direction-mobile': noStack ? (flexDirectionMobile || flexDirectionTablet || flexDirection) : 'column',
    '--align-items': alignItems,
    '--align-items-tablet': undefined,
    '--align-items-mobile': noStack ? undefined : 'stretch',
    '--justify-content': justifyContent,
    '--gap': gap,
    '--gap-tablet': gapTablet || gap,
    '--gap-mobile': gapMobile || gapTablet || gap,
    '--flex-wrap': flexWrap,
    '--flex-wrap-mobile': noStack ? flexWrap : 'wrap',
  };

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      style={containerStyle}
      className={`relative group/container elite-responsive ${selected ? 'z-10' : ''}`}
    >
      {/* Drop Zone Indicator when selected */}
      {selected && (
        <div className="absolute -top-6 left-0 bg-theme-primary text-white text-[10px] font-semibold px-2 py-1 rounded-t-lg shadow-lg z-20">
          Enterprise Container
        </div>
      )}
      
      {/* Recursive children slot */}
      {children || (
        <div className="flex-1 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 text-[10px] font-semibold bg-gray-50/50">
          Drop Components Here
        </div>
      )}

      {/* Internal empty state helper */}
      <style jsx>{`
        div :global(.craft-child-empty) {
          min-height: 100px;
          border: 2px dashed #e2e8f0;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 600;
          text-transform: none;
          letter-spacing: normal;
        }
      `}</style>
    </div>
  );
};

CraftContainer.craft = {
  props: {
    width: '100%',
    height: 'auto',
    padding: '24px',
    margin: '0px',
    backgroundColor: 'white',
    borderRadius: '24px',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: 'gray-100',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: '16px',
    flexWrap: 'nowrap',
    noStack: false,
    display: 'flex',
    // Breakpoint Defaults (undefined allows inheritance)
    widthTablet: undefined, widthMobile: undefined,
    heightTablet: undefined, heightMobile: undefined,
    paddingTablet: undefined, paddingMobile: undefined,
    marginTablet: undefined, marginMobile: undefined,
    gapTablet: undefined, gapMobile: undefined,
    flexDirectionTablet: undefined, flexDirectionMobile: undefined,
    displayTablet: undefined, displayMobile: undefined,
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
