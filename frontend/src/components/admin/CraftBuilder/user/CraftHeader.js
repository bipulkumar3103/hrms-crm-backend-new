import React from 'react';
import { useNode } from '@craftjs/core';

export const CraftHeader = ({ title, subtitle, alignment = 'left', maxWidth = 'auto', minWidth = 'auto', maxWidthTablet, maxWidthMobile, minWidthTablet, minWidthMobile, ...props }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      className={`p-10 mb-6 transition-all duration-300 ${selected ? 'bg-gray-50/10' : 'hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)]/5'} cursor-pointer rounded-3xl`}
      style={{ 
        textAlign: alignment,
        ring: selected ? `2px solid var(--theme-primary)` : 'none',
        boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : 'none',
        maxWidth: maxWidth || 'none',
        minWidth: minWidth || '0px',
        '--max-width': maxWidth,
        '--max-width-tablet': maxWidthTablet || maxWidth,
        '--max-width-mobile': maxWidthMobile || maxWidthTablet || maxWidth,
        '--min-width': minWidth,
        '--min-width-tablet': minWidthTablet || minWidth,
        '--min-width-mobile': minWidthMobile || minWidthTablet || minWidth,
      }}
    >
      <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-4">
        {title || "Craft Header"}
      </h1>
      <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
        {subtitle || "Drag and drop to build your elite dashboard experience."}
      </p>
    </div>
  );
};

CraftHeader.craft = {
  props: {
    title: 'Organizational Governance Protocol',
    subtitle: 'Centralizing enterprise resource management and strategic oversight.',
    maxWidth: 'auto',
    minWidth: 'auto',
    maxWidthTablet: undefined, maxWidthMobile: undefined,
    minWidthTablet: undefined, minWidthMobile: undefined,
  },
  rules: {
    canDrag: () => true,
  },
};
