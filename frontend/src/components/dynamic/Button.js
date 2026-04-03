import React from 'react';

function Button({ config, onNavigate }) {
  const handleClick = () => {
    if (config.targetRoute && onNavigate) {
      onNavigate(config.targetRoute);
    }
  };

  // Determine button style based on variant
  let btnClasses = "px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ";
  if (config.variant === 'secondary') {
    btnClasses += "bg-white border text-gray-700 hover:bg-gray-50 border-gray-200";
  } else {
    // Default to primary
    btnClasses += "text-white text-[var(--theme-bg)] hover:opacity-90 shadow-[0_4px_14px_rgba(0,0,0,0.1)]";
  }

  return (
    <div className="mb-4">
      <button 
        onClick={handleClick} 
        className={btnClasses}
        style={config.variant !== 'secondary' ? { backgroundColor: 'var(--theme-primary)' } : {}}
      >
        {config.label || "Click Me"}
      </button>
    </div>
  );
}

export default Button;
