import React from 'react';
import { useEditor, Element } from '@craftjs/core';
import { FiLayout, FiMaximize, FiType, FiPlus, FiGrid, FiSend } from 'react-icons/fi';
import { CraftHeader } from './user/CraftHeader';
import { CraftCard } from './user/CraftCard';
import { CraftTable } from './user/CraftTable';
import { CraftForm } from './user/CraftForm';
import { CraftButton } from './user/CraftButton';

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="w-full flex-1 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50" style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.2 }}>
        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--theme-primary)' }}>
          <FiLayout className="w-4 h-4" />
          Elite Builder Toolbox
        </h2>
        <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-tighter">Drag to build your dashboard</p>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Primary Components</label>
        
        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftHeader} padding="20px" />)}
          className="group p-4 bg-white border border-gray-100 rounded-3xl transition-all duration-300 cursor-move flex items-center gap-4 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiType className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Main Header</h4>
            <p className="text-[10px] text-gray-400 font-medium">Text & Branding</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftCard} padding="20px" />)}
          className="group p-4 bg-white border border-gray-100 rounded-3xl transition-all duration-300 cursor-move flex items-center gap-4 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiMaximize className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Enterprise Card</h4>
            <p className="text-[10px] text-gray-400 font-medium">Data Container</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftTable} padding="20px" />)}
          className="group p-4 bg-white border border-gray-100 rounded-3xl transition-all duration-300 cursor-move flex items-center gap-4 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiGrid className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Smart Table</h4>
            <p className="text-[10px] text-gray-400 font-medium">Automatic Lists</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftForm} padding="20px" />)}
          className="group p-4 bg-white border border-gray-100 rounded-3xl transition-all duration-300 cursor-move flex items-center gap-4 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiSend className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Smart Form</h4>
            <p className="text-[10px] text-gray-400 font-medium">Admin Intakes</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <CraftButton label="Smart Action" />)}
          className="group p-4 bg-white border border-gray-100 rounded-3xl transition-all duration-300 cursor-move flex items-center gap-4 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Smart Button</h4>
            <p className="text-[10px] text-gray-400 font-medium">Action & Nav</p>
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-300 font-black text-[10px] uppercase tracking-widest italic opacity-50">
        Craft.js Core Active
      </div>
    </div>
  );
};
