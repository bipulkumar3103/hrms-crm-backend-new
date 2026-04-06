import React from 'react';
import { useNode, Element } from '@craftjs/core';

export const CraftContainer = ({ 
  width = '100%', 
  height = 'auto',
  padding = '2rem',
  margin = '0px',
  backgroundColor = 'transparent',
  borderRadius = '0px',
  borderWidth = '0px',
  borderStyle = 'solid',
  borderColor = '#e2e8f0',
  flexDirection = 'column',
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  gap = '1rem',
  children,
  ...props 
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const containerStyle = {
    width,
    height,
    padding,
    margin,
    backgroundColor,
    borderRadius,
    borderWidth,
    borderStyle,
    borderColor,
    display: 'flex',
    flexDirection,
    alignItems,
    justifyContent,
    gap,
    transition: 'all 0.3s ease',
    position: 'relative',
    minHeight: height === 'auto' ? '120px' : height,
    boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : 'none',
    boxSizing: 'border-box'
  };

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      style={containerStyle}
      className={`relative group/container ${selected ? 'z-10' : ''}`}
    >
      {/* Drop Zone Indicator when selected */}
      {selected && (
        <div className="absolute -top-6 left-0 bg-theme-primary text-white text-[10px] font-black px-2 py-1 rounded-t-lg uppercase tracking-widest shadow-lg z-20">
          Enterprise Container
        </div>
      )}
      
      {/* Recursive children slot */}
      {children || (
        <div className="flex-1 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 text-[10px] font-black uppercase tracking-widest bg-gray-50/50">
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
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
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
    backgroundColor: 'transparent',
    borderRadius: '16px',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: '#f1f5f9',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: '16px',
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
