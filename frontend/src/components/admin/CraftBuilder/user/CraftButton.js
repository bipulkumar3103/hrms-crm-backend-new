import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import * as Icons from 'react-icons/fi';

export const CraftButton = ({ 
  label = 'Smart Action', 
  variant = 'solid', 
  color = 'primary', 
  size = 'md', 
  targetRoute = '', 
  icon = 'FiArrowRight', 
  alignment = 'left',
  fullWidth = false,
  showIcon = true,
  iconSize = '',
  borderRadius = '',
  fontSize = '10px',
  fontWeight = '700',
  textColor = 'white', 
  borderColor = '',
  borderWidth = '',
  flexWrap = 'nowrap',
  maxWidth = 'auto',
  minWidth = 'auto',
  maxWidthTablet, maxWidthMobile,
  minWidthTablet, minWidthMobile,
  padding = '',
  margin = '',
  ...props 
}) => {
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const IconComponent = Icons[icon] || Icons.FiArrowRight;

  // Elite Styling Logic
  const getVariantClasses = () => {
    const base = "font-semibold tracking-tighter transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer";
    
    const sizeStyles = {
      sm: { px: '1rem', py: '0.5rem', fontSize: '9px', radius: '0.75rem' },
      md: { px: '1.5rem', py: '0.75rem', fontSize: '10px', radius: '1rem' },
      lg: { px: '2rem', py: '1rem', fontSize: '12px', radius: '1.5rem' },
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;

    // Universal Theme Resolution Engine
    const resolveColor = (val) => {
      if (!val) return 'transparent';
      const isHex = val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
      if (isHex) return val;
      
      const presets = {
        white: '#ffffff',
        black: '#000000',
        transparent: 'transparent',
        'gray-50': '#f9fafb',
        'gray-100': '#f3f4f6'
      };

      if (presets[val.toLowerCase()]) return presets[val.toLowerCase()];
      
      // Resolve as a dynamic brand token
      return `var(--theme-${val.replace('theme-', '')})`;
    };
    
    const themeColor = resolveColor(color);
    const resolvedTextColor = resolveColor(textColor || 'white');
    const resolvedBorderColor = resolveColor(borderColor || themeColor);

    const variantStyles = {
      solid: {
        backgroundColor: themeColor,
        color: resolvedTextColor,
        border: 'none',
      },
      outline: {
        backgroundColor: 'transparent',
        color: resolvedTextColor,
        border: `2px solid ${themeColor}20`,
      },
      ghost: {
        backgroundColor: `${themeColor}10`,
        color: resolvedTextColor,
        border: 'none',
        boxShadow: 'none',
      }
    };

    const actualShadow = variant === 'solid' ? '0 10px 25px -5px rgba(0,0,0,0.1)' : 'none';

    const effectiveIconSize = iconSize || fontSize || currentSize.fontSize;

    const finalStyle = { 
      ...(variantStyles[variant] || variantStyles.solid),
      padding: `${currentSize.py} ${currentSize.px}`,
      fontSize: fontSize || currentSize.fontSize,
      borderRadius: borderRadius || currentSize.radius,
      boxSizing: 'border-box',
      outline: 'none',
      fontWeight: fontWeight,
      // Precision Centering & Wrapping Implementation
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.625rem',
      flexWrap: flexWrap,
      textAlign: 'center',
      // Elite Breakpoint Variable Mapping
      '--width': fullWidth ? '100%' : 'fit-content',
      '--width-mobile': '100%',
      '--max-width': maxWidth,
      '--max-width-tablet': maxWidthTablet || maxWidth,
      '--max-width-mobile': maxWidthMobile || maxWidthTablet || maxWidth,
      '--min-width': minWidth,
      '--min-width-tablet': minWidthTablet || minWidth,
      '--min-width-mobile': minWidthMobile || minWidthTablet || minWidth,
      maxWidth: 'var(--max-width)',
      minWidth: 'var(--min-width)',
      // Dynamic depth shadow preserved
      boxShadow: actualShadow,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: padding || `${currentSize.py} ${currentSize.px}`,
      margin: margin || '0',
    };
    
    // Professional Border System Overrides
    if (borderWidth) {
      finalStyle.borderWidth = borderWidth;
      finalStyle.borderStyle = 'solid';
      finalStyle.borderColor = resolvedBorderColor;
    } else if (borderColor) {
      finalStyle.borderColor = resolvedBorderColor;
    }

    return { 
      className: `${base} elite-responsive`, 
      style: finalStyle,
      effectiveIconSize
    };
  };

  const { className, style, effectiveIconSize } = getVariantClasses();

  const handleNavigate = () => {
    if (enabled) return; // 🛑 Prevent redirect in Build Mode
    if (!targetRoute) return;
    
    if (targetRoute.startsWith('http')) {
      window.open(targetRoute, '_blank');
    } else {
      // Use standard location protocol to ensure it works outside a Router context (like the builder)
      window.location.href = targetRoute;
    }
  };

  return (
    <div className={`mb-4 flex items-center py-2 ${alignment === 'center' ? 'justify-center mx-auto' : alignment === 'right' ? 'justify-end ml-auto' : 'justify-start mr-auto'}`} style={{ width: fullWidth ? '100%' : 'fit-content' }}>
      <button 
        ref={(ref) => connect(drag(ref))}
        onClick={handleNavigate}
        className={className}
        style={style}
      >
        <span>{label}</span>
        {showIcon && <IconComponent size={effectiveIconSize} />}
      </button>
    </div>
  );
};

CraftButton.craft = {
  props: {
    label: 'Smart Action',
    variant: 'solid',
    color: 'primary',
    size: 'md',
    targetRoute: '',
    icon: 'FiArrowRight',
    alignment: 'left',
    fullWidth: false,
    showIcon: true,
    iconSize: '',
    borderRadius: '',
    fontSize: '10px',
    fontWeight: '700',
    textColor: 'white',
    borderColor: '',
    borderWidth: '',
    flexWrap: 'nowrap',
    maxWidth: 'auto',
    minWidth: 'auto',
    maxWidthTablet: undefined, maxWidthMobile: undefined,
    minWidthTablet: undefined, minWidthMobile: undefined,
    padding: '',
    margin: '',
    alignment: 'center',
  },
  rules: {
    canDrag: () => true,
  },
};
