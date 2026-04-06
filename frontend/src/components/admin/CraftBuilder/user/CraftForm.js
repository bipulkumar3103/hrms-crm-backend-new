import React from 'react';
import { useNode } from '@craftjs/core';
import { FiPlus, FiSend, FiZap, FiBox } from 'react-icons/fi';

export const CraftForm = ({ title, submitLabel, fields = [], ...props }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div 
      ref={(ref) => connect(drag(ref))}
      className={`bg-white p-12 rounded-[2.5rem] shadow-2xl transition-all duration-300 border ${selected ? 'shadow-xl' : 'border-gray-50'}`}
      style={{ 
        boxShadow: selected ? `0 20px 25px -5px var(--theme-secondary)` : 'none',
        ring: selected ? `2px solid var(--theme-primary)` : 'none',
        borderColor: selected ? 'var(--theme-primary)' : '#f8fafc'
      }}
    >
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-3 italic">
            {title || "Dynamic Protocol Form"}
          </h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <FiZap className="animate-pulse" style={{ color: 'var(--theme-primary)' }} />
            Enterprise Data Link Active
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: 'var(--theme-primary)' }}>
            <FiSend size={24} />
        </div>
      </div>

      <div className="space-y-6">
        {(fields.length > 0 ? fields : [
            {label: 'Full Identity Name', name: 'name', type: 'text', placeholder: 'Enter full name...'},
            {label: 'Corporate Email', name: 'email', type: 'email', placeholder: 'name@company.com'}
        ]).map((field, idx) => (
          <div key={idx} className="group/field">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1 transition-colors" style={{ groupHoverFieldColor: 'var(--theme-primary)' }}>
              {field.label}
              {field.required && <span className="text-rose-500 ml-1 opacity-50">*</span>}
            </label>
            {field.type === 'textarea' ? (
                <textarea 
                  disabled
                  placeholder={field.placeholder}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-medium text-gray-800 placeholder:text-gray-300 cursor-default"
                  rows="3"
                />
            ) : (
                <input 
                  disabled
                  type={field.type} 
                  placeholder={field.placeholder}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-medium text-gray-800 placeholder:text-gray-300 cursor-default shadow-sm transition-all"
                  style={{ groupHoverFieldBorderColor: 'var(--theme-primary)' }}
                />
            )}
          </div>
        ))}

        <div className="pt-8">
            <button 
                type="button" 
                className="w-full py-5 text-white font-black text-sm uppercase tracking-[0.2em] rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-4"
                style={{ backgroundColor: 'var(--theme-primary)' }}
            >
                <FiSend size={20} className="opacity-40" />
                {submitLabel || "Dispatch Protocol"}
            </button>
        </div>
      </div>
      
      <div className="mt-12 flex items-center justify-center gap-3 text-[10px] text-gray-300 font-bold uppercase tracking-widest opacity-50 select-none pb-2">
         <FiBox /> Advanced Form Logic Layer 2
      </div>
    </div>
  );
};

CraftForm.craft = {
  props: {
    title: 'Employee Onboarding',
    submitLabel: 'Finalize Deployment',
    submitEndpoint: '/api/v1/employees/onboard',
    fields: [
        { label: "Identity Key", name: "full_name", type: "text", placeholder: "Personnel Name", required: true },
        { label: "Security Email", name: "email", type: "email", placeholder: "corporate@access.link", required: true },
        { label: "Onboarding Notes", name: "notes", type: "textarea", placeholder: "Additional metadata..." }
    ],
  },
  rules: {
    canDrag: () => true,
  },
};
