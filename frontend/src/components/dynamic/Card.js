import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import { FiMaximize } from 'react-icons/fi';

const resolveColor = (val) => {
  if (!val || val === 'transparent') return 'transparent';
  if (val === 'white') return '#ffffff';
  if (val === 'primary' || val === 'theme-primary' || val === 'theme_primary') return 'var(--theme-primary)';
  if (val === 'secondary' || val === 'theme-secondary' || val === 'theme_secondary') return 'var(--theme-secondary)';
  if (val === 'accent' || val === 'theme-accent' || val === 'theme_accent') return 'var(--theme-accent)';
  
  const isHex = val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
  if (isHex) return val;
  
  return `var(--theme-${val.replace('theme-', '')})`;
};

const toMetric = (val) => {
  if (val === null || val === undefined || val === '' || val === 'auto') return 'auto';
  if (!isNaN(val) && typeof val !== 'boolean') return `${val}px`;
  return val;
};

const UniversalField = ({ label, value, path }) => {
  if (value === null || value === undefined || value === '') return null;

  return (
    <div className="flex flex-col mb-4">
      {label && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400/80 mb-1">{label}</span>}
      <div className="text-[14px] font-semibold text-gray-800 break-words">
        {value}
      </div>
    </div>
  );
};

function Card({ config, theme, providedData, children }) {
  const { 
    title = '', 
    subtitle = '', 
    dataSource = '',
    fields = [],
    padding = '24px',
    borderRadius = '32px',
    backgroundColor = 'white',
    width = '100%',
    maxWidth = 'auto',
    minWidth = 'auto',
    height = 'auto',
    margin = '0px',
    borderWidth = '1px',
    borderColor = 'gray-100',
    borderStyle = 'solid',
    paddingTablet, paddingMobile,
    widthTablet, widthMobile,
    maxWidthTablet, maxWidthMobile,
    minWidthTablet, minWidthMobile,
    heightTablet, heightMobile,
    marginTablet, marginMobile,
    display = 'block'
  } = config;

  const [localData, setLocalData] = useState(null);

  useEffect(() => {
    if (dataSource) {
      const fetchData = async () => {
        try {
          const { api } = require('../../utils/api');
          let url = dataSource.trim().replace(/^https?:\/\/[^\/]+/, '').replace(/^\/?api\/v1/, '');
          if (!url.startsWith('/')) url = '/' + url;
          const res = await api.get(url);
          setLocalData(res.data);
        } catch (e) {
          console.error('[Card Fetch Error]', e);
        }
      };
      fetchData();
    }
  }, [dataSource]);

  const activeData = localData || providedData;

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

  const cardStyle = {
    padding: 'var(--padding)',
    margin: 'var(--margin)',
    display: display,
    width: 'var(--width)',
    height: 'var(--height)',
    minHeight: height === 'auto' ? 'auto' : 'var(--height)',
    maxWidth: 'var(--max-width)',
    minWidth: 'var(--min-width)',
    backgroundColor: resolveColor(backgroundColor),
    borderRadius: toMetric(borderRadius),
    borderWidth: toMetric(borderWidth),
    borderStyle: borderStyle,
    borderColor: resolveColor(borderColor),
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    
    // Responsive Variables
    '--width': toMetric(width),
    '--width-tablet': toMetric(widthTablet || width),
    '--width-mobile': toMetric(widthMobile || widthTablet || width),
    '--padding': toMetric(padding),
    '--padding-tablet': toMetric(paddingTablet || padding),
    '--padding-mobile': toMetric(paddingMobile || paddingTablet || padding),
    '--max-width': toMetric(maxWidth),
    '--max-width-tablet': toMetric(maxWidthTablet || maxWidth),
    '--max-width-mobile': toMetric(maxWidthMobile || maxWidthTablet || maxWidth),
    '--min-width': toMetric(minWidth),
    '--min-width-tablet': toMetric(minWidthTablet || minWidth),
    '--min-width-mobile': toMetric(minWidthMobile || minWidthTablet || minWidth),
    '--height': toMetric(height),
    '--height-tablet': toMetric(heightTablet || height),
    '--height-mobile': toMetric(heightMobile || heightTablet || height),
    '--margin': toMetric(margin),
    '--margin-tablet': toMetric(marginTablet || margin),
    '--margin-mobile': toMetric(marginMobile || marginTablet || margin),
  };

  return (
    <motion.div style={cardStyle} className="group">
      <div className="relative z-10">
        {title && (
          <div className="mb-6">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">
              {resolveDynamicString(title)}
            </h3>
            {subtitle && (
              <p className="text-sm font-medium text-gray-400">
                {resolveDynamicString(subtitle)}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          {fields.map((field, idx) => (
            <UniversalField 
              key={idx}
              label={field.label}
              value={resolveDynamicString(field.bind ? `{{${field.bind}}}` : (field.value || ''))}
            />
          ))}
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default Card;
