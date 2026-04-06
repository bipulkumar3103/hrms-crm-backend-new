import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiUser, FiBox, FiCheckCircle, FiInfo } from 'react-icons/fi';

/**
 * UniversalField Component
 * Handles automatic formatting for different data types within the card.
 */
const UniversalField = ({ label, value, path, theme, alignment }) => {
  if (value === null || value === undefined || value === '') return null;

  const isCenter = alignment === 'center';

  // 1. Images / Avatars
  const isImage = typeof value === 'string' && (
    value.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) || 
    path?.includes('avatar') || path?.includes('logo') || path?.includes('image')
  );

  if (isImage) {
    return (
      <div className={`flex flex-col mb-4 ${isCenter ? 'items-center' : ''}`}>
        {label && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</span>}
        <div className="w-16 h-16 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-gray-50">
          <img src={value} alt={label || 'Asset'} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  // 2. Statuses / Badges
  const isStatus = path?.toLowerCase().includes('status') || path?.toLowerCase().includes('role') || path?.toLowerCase().includes('state');
  if (isStatus) {
    const status = String(value).toLowerCase();
    let bg = 'bg-gray-100', text = 'text-gray-600', dot = 'bg-gray-400';
    if (['active', 'success', 'completed', 'admin', 'verified'].includes(status)) {
        bg = 'bg-emerald-50'; text = 'text-emerald-700'; dot = 'bg-emerald-500';
    } else if (['pending', 'invited', 'onboarding', 'waiting'].includes(status)) {
        bg = 'bg-amber-50'; text = 'text-amber-700'; dot = 'bg-amber-500';
    } else if (['inactive', 'failed', 'rejected'].includes(status)) {
        bg = 'bg-rose-50'; text = 'text-rose-700'; dot = 'bg-rose-500';
    }

    return (
      <div className={`flex flex-col mb-3 ${isCenter ? 'items-center' : ''}`}>
        {label && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</span>}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${bg} ${text} border border-current/10 w-fit`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot} mr-2 shadow-[0_0_8px_rgba(0,0,0,0.1)]`}></span>
          {value}
        </span>
      </div>
    );
  }

  // 3. Regular Text / Dates
  const isDate = typeof value === 'string' && (value.match(/^\d{4}-\d{2}-\d{2}/) || path?.includes('date'));
  let displayValue = value;
  if (isDate) {
    try {
      displayValue = new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {}
  }

  return (
    <div className={`flex flex-col mb-3 ${isCenter ? 'items-center text-center' : ''}`}>
      {label && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</span>}
      <p className="text-[14px] font-semibold text-gray-800 flex items-center leading-tight">
        {isDate && <FiCalendar className="mr-2 opacity-30" size={14} />}
        {displayValue}
      </p>
    </div>
  );
};

/**
 * Enterprise Elite Card
 * A premium, data-aware layout block.
 */
function Card({ config, theme, providedData, children }) {
  const { 
    title = '', 
    subtitle = '', 
    dataSource = '',
    fields = [],
    style = {},
    backgroundType = 'solid', // 'solid', 'gradient', 'glass'
    backgroundGradient = 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    backgroundColor = '',
    glassOpacity = 0.5,
    glassBlur = '10px',
    shadow = 'md',
    layout = 'vertical', // 'vertical', 'grid-2'
    accentColor = '',
    padding = '1.5rem',
    alignment = '', // Support for centering
    
    // Typography Features
    titleSize = '1.25rem',
    titleColor = '',
    titleItalic = false,
    titleUnderline = false,
    subtitleSize = '0.875rem',
    subtitleColor = '',
    subtitleItalic = false,
    subtitleUnderline = false
  } = config;

  const [localData, setLocalData] = useState(null);
  const [loading, setLoading] = useState(!!dataSource);

  useEffect(() => {
    if (dataSource) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const { api } = require('../../utils/api');
          const res = await api.get(dataSource);
          setLocalData(res.data);
        } catch (e) {
          console.error('[Card Fetch Error]', e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [dataSource]);

  const activeData = localData || providedData;

  // --- Dynamic String Resolver ---
  const resolveDynamicString = (str) => {
    if (!str || typeof str !== 'string' || !activeData) return str;
    return str.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const keys = path.trim().split('.');
      let val = activeData;
      for (const key of keys) {
        val = val ? val[key] : null;
      }
      return val !== null && val !== undefined ? val : match;
    });
  };

  const resolvedTitle = resolveDynamicString(title);
  const resolvedSubtitle = resolveDynamicString(subtitle);

  // --- Style Engineering ---
  const shadowMap = {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)'
  };

  const getBackground = () => {
    if (backgroundType === 'gradient') return { background: backgroundGradient };
    if (backgroundType === 'glass') return {
      backgroundColor: `rgba(255, 255, 255, ${glassOpacity})`,
      backdropFilter: `blur(${glassBlur})`,
      WebkitBackdropFilter: `blur(${glassBlur})`,
      border: '1px solid rgba(255, 255, 255, 0.4)'
    };
    return { backgroundColor: backgroundColor || '#ffffff' };
  };

  const cardStyle = {
    ...getBackground(),
    borderRadius: style.borderRadius || '24px',
    boxShadow: shadowMap[shadow] || shadowMap.md,
    borderLeft: accentColor ? `5px solid ${accentColor}` : (style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || '#e2e8f0'}` : 'none'),
    ...style
  };

  const textStyle = (baseSize, baseColor, isItalic, isUnderline) => ({
    fontSize: baseSize,
    color: baseColor || theme?.theme_text_color || '#1e293b',
    fontStyle: isItalic ? 'italic' : 'normal',
    textDecoration: isUnderline ? 'underline' : 'none',
    textDecorationThickness: isUnderline ? '2px' : 'auto',
    textUnderlineOffset: isUnderline ? '4px' : 'auto'
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: shadowMap.xl }}
      className={`relative overflow-hidden transition-all duration-300 group ${padding === '1.5rem' ? 'p-5 md:p-8' : ''}`}
      style={{ ...cardStyle, padding: padding === '1.5rem' ? undefined : padding }}
    >
      <div className="relative z-10">
        {/* Card Header Area */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className={`mb-6 ${alignment === 'center' || !alignment ? 'text-center' : ''}`}>
            {resolvedTitle && (
              <h3 
                className="font-black tracking-tight leading-tight mb-2 text-lg md:text-xl" 
                style={textStyle(titleSize, titleColor, titleItalic, titleUnderline)}
              >
                {resolvedTitle}
              </h3>
            )}
            {resolvedSubtitle && (
              <p 
                className="font-medium opacity-60 leading-relaxed text-[13px] md:text-sm" 
                style={textStyle(subtitleSize, subtitleColor, subtitleItalic, subtitleUnderline)}
              >
                {resolvedSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className={layout === 'grid-2' ? 'grid grid-cols-1 md:grid-cols-2 gap-x-6' : 'space-y-1'}>
          {loading ? (
            <div className="flex items-center space-x-2 py-4">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce delay-75" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce delay-150" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
            </div>
          ) : (
            fields.map((field, idx) => (
              <UniversalField 
                key={idx} 
                label={field.label} 
                alignment={alignment || 'center'} // Smart default for user's aesthetic
                value={activeData ? resolveDynamicString(field.bind ? (getValue(activeData, field.bind) || '') : (field.value || '')) : (field.value || '')}
                path={field.bind}
                theme={theme}
              />
            ))
          )}

          {/* Manual Nesting Slot (Recursive) */}
          {children}
        </div>
      </div>

      {/* Decorative Accent */}
      {!accentColor && backgroundType === 'solid' && (
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl opacity-10 transition-colors duration-500 group-hover:opacity-20" style={{ backgroundColor: 'var(--theme-primary)' }} />
      )}
    </motion.div>
  );
}

// Helper to safely resolve dot notation
const getValue = (obj, path) => {
    if (!path) return null;
    return path.split('.').reduce((o, p) => (o ? o[p] : null), obj);
};

export default Card;
