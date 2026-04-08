import React from 'react';
import * as Icons from 'react-icons/fi';

const toMetric = (val) => {
  if (val === null || val === undefined || val === '') return undefined;
  if (!isNaN(val) && typeof val !== 'boolean') return `${val}px`;
  return val;
};

function Button({ config, onNavigate }) {
  const {
    label = "Smart Action",
    icon = "FiArrowRight",
    showIcon = true,
    variant = "solid",
    alignment = "left",
    fullWidth = false,
    targetRoute = "",
    fontSize = "",
    iconSize = "",
    borderRadius = "",
    size = "md"
  } = config || {};

  const IconComponent = Icons[icon] || Icons.FiArrowRight;
  
  // Elite Sizing Engine
  const sizeStyles = {
    sm: { px: 12, py: 6, fontSize: 9, radius: 8 },
    md: { px: 20, py: 10, fontSize: 10, radius: 12 },
    lg: { px: 32, py: 14, fontSize: 13, radius: 16 },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const handleClick = () => {
    if (targetRoute && onNavigate) {
      onNavigate(targetRoute);
    }
  };

  // Determine button style based on variant
  let btnClasses = "font-bold tracking-tight transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer elite-responsive ";
  
  if (variant === 'secondary') {
    btnClasses += "bg-white border text-gray-700 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] border-gray-200";
  } else {
    // Default to primary
    btnClasses += "text-white hover:opacity-90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]";
  }

  const style = {
    backgroundColor: variant !== 'secondary' ? 'var(--theme-primary)' : undefined,
    fontSize: toMetric(fontSize) || toMetric(currentSize.fontSize),
    padding: `${toMetric(currentSize.py)} ${toMetric(currentSize.px)}`,
    borderRadius: toMetric(borderRadius) || toMetric(currentSize.radius),
    // Precision Centering Implementation
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    // Elite Breakpoint Variable Mapping
    '--width': fullWidth ? '100%' : 'fit-content',
    '--width-mobile': '100%',
    '--flex-direction-mobile': 'row', // Force horizontal on mobile inside buttons
  };

  return (
    <div className={`mb-4 flex items-center ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
      <button 
        onClick={handleClick} 
        className={btnClasses}
        style={style}
      >
        <span>{label}</span>
        {showIcon && <IconComponent size={toMetric(iconSize) || toMetric(fontSize) || toMetric(currentSize.fontSize)} />}
      </button>
    </div>
  );
}

export default Button;
