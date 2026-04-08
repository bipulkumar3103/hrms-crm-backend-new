import React from 'react';
import { useEditor, Element } from '@craftjs/core';
import { FiLayout, FiMaximize, FiType, FiPlus, FiGrid, FiSend } from 'react-icons/fi';
import { CraftHeader } from './user/CraftHeader';
import { CraftCard } from './user/CraftCard';
import { CraftTable } from './user/CraftTable';
import { CraftForm } from './user/CraftForm';
import { CraftButton } from './user/CraftButton';
import { CraftContainer } from './user/CraftContainer';

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="w-full flex-1 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm overflow-hidden">
      <div className="p-5 border-b border-theme-primary/10 bg-theme-secondary shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-theme-primary/20 transition-all duration-700"></div>
        <h2 className="text-[10px] font-semibold flex items-center gap-2 text-theme-primary">
          <FiLayout className="w-3.5 h-3.5" />
          Elite Toolbox
        </h2>
        <p className="text-[9px] text-theme-primary/60 mt-2 font-medium tracking-tighter">Drag to build enterprise architecture</p>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
        <label className="block text-[10px] font-semibold text-gray-400 pl-2 mb-2">Structural Layout</label>

        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftContainer} title="Strategic Resource Governance" subtitle="Centralizing organizational capital and efficiency." padding="20px" canvas />)}
          className="group p-2.5 bg-white border border-gray-100 rounded-2xl transition-all duration-300 cursor-move flex items-center gap-3 active:scale-95 hover:shadow-xl hover:border-theme-primary hover:bg-theme-secondary/30"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-theme-primary group-hover:text-white text-theme-primary">
            <FiLayout className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-theme-primary transition-colors">Enterprise Div</h4>
            <p className="text-[10px] text-gray-400 font-medium">Nested Container</p>
          </div>
        </div>

        <div className="h-4"></div>
        <label className="block text-[10px] font-semibold text-gray-400 pl-2 mb-2">Primary Components</label>
        
        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftHeader} title="Strategic Resource Governance" subtitle="Centralizing organizational capital and efficiency." padding="20px" />)}
          className="group p-2.5 bg-white border border-gray-100 rounded-2xl transition-all duration-300 cursor-move flex items-center gap-3 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiType className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Main Header</h4>
            <p className="text-[10px] text-gray-400 font-medium">Text & Branding</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftCard} title="Performance Momentum Index" subtitle="Visualizing benchmarks vs organizational KPIs." fields={[{label: 'User Account', bind: 'email'}]} padding="20px" />)}
          className="group p-2.5 bg-white border border-gray-100 rounded-2xl transition-all duration-300 cursor-move flex items-center gap-3 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiMaximize className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Enterprise Card</h4>
            <p className="text-[10px] text-gray-400 font-medium">Data Container</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftTable} padding="20px" />)}
          className="group p-2.5 bg-white border border-gray-100 rounded-2xl transition-all duration-300 cursor-move flex items-center gap-3 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiGrid className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Smart Table</h4>
            <p className="text-[10px] text-gray-400 font-medium">Automatic Lists</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <Element is={CraftForm} padding="20px" />)}
          className="group p-2.5 bg-white border border-gray-100 rounded-2xl transition-all duration-300 cursor-move flex items-center gap-3 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiSend className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Smart Form</h4>
            <p className="text-[10px] text-gray-400 font-medium">Admin Intakes</p>
          </div>
        </div>

        <div 
          ref={(ref) => connectors.create(ref, <CraftButton label="Generate Insight Report" />)}
          className="group p-2.5 bg-white border border-gray-100 rounded-2xl transition-all duration-300 cursor-move flex items-center gap-3 active:scale-95 hover:shadow-xl hover:border-[var(--theme-primary)] hover:bg-[var(--theme-secondary)]"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm bg-white group-hover:bg-[var(--theme-primary)] group-hover:text-white text-[var(--theme-primary)]">
            <FiPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-[var(--theme-primary)] transition-colors">Smart Button</h4>
            <p className="text-[10px] text-gray-400 font-medium">Action & Nav</p>
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-300 font-semibold text-[10px] italic opacity-50">
        Craft.js Core Active
      </div>
    </div>
  );
};
