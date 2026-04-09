import React from 'react';
 
const toMetric = (val) => {
  if (val === null || val === undefined || val === '') return undefined;
  if (!isNaN(val) && typeof val !== 'boolean') return `${val}px`;
  return val;
};

/**
 * Enterprise Elite Header
 * A high-powered, data-aware header block with advanced styling.
 */
function Header({ config, theme, providedData }) {
  const { 
    title = '', 
    subtitle = '', 
    style = {},
    alignment = 'left',
    backgroundType = 'solid', // 'solid', 'gradient', 'glass'
    backgroundColor = '',
    maxWidth = 'auto',
    minWidth = 'auto',
    maxWidthTablet, maxWidthMobile,
    minWidthTablet, minWidthMobile,
    glassOpacity = 0.7,
    glassBlur = '12px',
    titleSize = '2.25rem',
    titleWeight = '900',
    subtitleSize = '1.1rem',
    subtitleWeight = '500',
    padding = '2.5rem',
    shadow = 'none', // 'none', 'sm', 'md', 'lg'
    textColor = '',
    
    // Typography Extensions
    titleItalic = false,
    titleUnderline = false,
    subtitleItalic = false,
    subtitleUnderline = false
  } = config;

  const [localData, setLocalData] = React.useState(null);

  React.useEffect(() => {
    if (config?.dataSource) {
      const fetchData = async () => {
        try {
          const { api: apiUtil } = require('../../utils/api');
          const res = await apiUtil.get(config.dataSource);
          setLocalData(res.data);
        } catch (e) {
          console.error('[Header Fetch Error]', e);
        }
      };
      fetchData();
    }
  }, [config?.dataSource]);

  const activeData = localData || providedData;

  console.log(`[Header DEBUG] Title: "${title}" | hasContext: ${!!providedData} | hasLocal: ${!!localData} | ActiveKeys:`, activeData ? Object.keys(activeData) : 'NONE');

  // --- Dynamic Data Resolver ---
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
  const getBackgroundStyle = () => {
    if (backgroundType === 'gradient') return { backgroundColor: backgroundColor || theme?.theme_primary_color || '#6366f1' };
    if (backgroundType === 'glass') return { 
        backgroundColor: `rgba(255, 255, 255, ${glassOpacity})`,
        backdropFilter: `blur(${glassBlur})`,
        WebkitBackdropFilter: `blur(${glassBlur})`,
        border: '1px solid rgba(255, 255, 255, 0.3)'
    };
    return { backgroundColor: backgroundColor || theme?.theme_secondary_color || '#f8fafc' };
  };

  const shadowMap = {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
  };

  const containerStyle = {
    ...getBackgroundStyle(),
    borderRadius: style.borderRadius || '24px',
    boxShadow: shadowMap[shadow] || 'none',
    textAlign: alignment,
    borderLeft: backgroundType === 'solid' ? `6px solid ${theme?.theme_primary_color || '#6366f1'}` : 'none',
    '--max-width': toMetric(maxWidth),
    '--max-width-tablet': toMetric(maxWidthTablet || maxWidth),
    '--max-width-mobile': toMetric(maxWidthMobile || maxWidthTablet || maxWidth),
    '--min-width': toMetric(minWidth),
    '--min-width-tablet': toMetric(minWidthTablet || minWidth),
    '--min-width-mobile': toMetric(minWidthMobile || minWidthTablet || minWidth),
    maxWidth: 'var(--max-width)',
    minWidth: 'var(--min-width)',
    ...style
  };

  const finalTextColor = textColor || theme?.theme_text_color || '#1e293b';

  return (
    <header 
      className={`relative overflow-hidden transition-all duration-500 rounded-3xl ${padding === '2.5rem' ? 'p-6 md:p-10' : ''}`}
      style={{ ...containerStyle, padding: padding === '2.5rem' ? undefined : padding }}
    >
      {/* Visual Accent for Center alignment */}
      {alignment === 'center' && (
        <div className="mx-auto w-12 h-1.5 rounded-full mb-5 opacity-40" style={{ backgroundColor: 'var(--theme-primary)' }} />
      )}

      <h1 
        className="tracking-tighter leading-[1.1] md:leading-none"
        style={{ 
            fontSize: alignment === 'center' ? `calc(${titleSize} * 0.8)` : titleSize, 
            fontWeight: titleWeight,
            color: finalTextColor,
            fontStyle: titleItalic ? 'italic' : 'normal',
            textDecoration: titleUnderline ? 'underline' : 'none',
            textDecorationThickness: titleUnderline ? '3px' : 'auto',
            textUnderlineOffset: titleUnderline ? '8px' : 'auto'
        }}
      >
        {resolvedTitle}
      </h1>
      
      {resolvedSubtitle && (
        <p 
            className="mt-4 max-w-2xl text-[0.95rem] md:text-[1.1rem]"
            style={{ 
                fontSize: subtitleSize, 
                fontWeight: subtitleWeight,
                color: finalTextColor,
                opacity: 0.7,
                margin: alignment === 'center' ? '1rem auto 0' : '1rem 0 0',
                fontStyle: subtitleItalic ? 'italic' : 'normal',
                textDecoration: subtitleUnderline ? 'underline' : 'none',
                textUnderlineOffset: '4px'
            }}
        >
            {resolvedSubtitle}
        </p>
      )}
    </header>
  );
}

export default Header;
