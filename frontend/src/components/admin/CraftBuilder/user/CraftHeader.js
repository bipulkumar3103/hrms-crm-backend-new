import React from 'react';
import { useNode } from '@craftjs/core';

export const CraftHeader = ({ title, subtitle, alignment = 'left', ...props }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      className={`p-10 mb-6 transition-all duration-300 ${selected ? 'bg-gray-50/10' : 'hover:bg-gray-50/5'} cursor-pointer rounded-3xl`}
      style={{ 
        textAlign: alignment,
        ring: selected ? `2px solid var(--theme-primary)` : 'none',
        boxShadow: selected ? `0 0 0 2px var(--theme-primary)` : 'none'
      }}
    >
      <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
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
    title: 'New Dynamic Header',
    subtitle: 'Manage your enterprise data with precision.',
    alignment: 'left',
  },
  rules: {
    canDrag: () => true,
  },
};
