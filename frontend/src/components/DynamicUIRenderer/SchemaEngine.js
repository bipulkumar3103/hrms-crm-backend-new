import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import Header from '../dynamic/Header';
import Card from '../dynamic/Card';
import Table from '../dynamic/Table';
import Button from '../dynamic/Button';
import DynamicForm from '../dynamic/DynamicForm';
// Add more components here as needed

const componentMap = {
  header: Header,
  card: Card,
  table: Table,
  button: Button,
  form: DynamicForm,
};

export const getValue = (obj, path) => {
  if (!obj || !path) return null;
  return path.split('.').reduce((o, p) => (o ? o[p] : null), obj);
};

export const resolveDynamicString = (str, data) => {
  if (!str || typeof str !== 'string' || !data) return str;
  return str.replace(/\{\{(.*?)\}\}/g, (match, path) => {
    const val = getValue(data, path.trim());
    return val !== null && val !== undefined ? String(val) : match;
  });
};

const bindData = (ui, data) => {
  if (!data) return ui;
  const boundUI = JSON.parse(JSON.stringify(ui)); // deep copy safely
    const traverse = (obj) => {
      for (const key in obj) {
        // Skip data binding for components that have their own data source
        if (obj[key]?.config?.dataSource) continue;

        if (obj[key] && typeof obj[key] === 'object') {
          // If the object itself has a 'bind' property, try to resolve it
          if (obj[key].bind && typeof obj[key].bind === 'string') {
            const dataValue = getValue(data, obj[key].bind);
            
            // Only replace the whole object if it's a simple bind-placeholder (no header/other keys)
            // or if we're specifically mapping a value property.
            if (Object.keys(obj[key]).length === 1 || key === 'value') {
              obj[key] = dataValue;
            } else {
              // Otherwise, just resolve the bind property into a new 'value' or similar property
              // and preserve other keys (like 'header' in table columns)
              obj[key]._resolvedValue = dataValue;
            }
          } else {
            traverse(obj[key]);
          }
        }
      }
    };
  traverse(boundUI);
  return boundUI;
};

// <SchemaEngine route="/employee/dashboard" dataSource="/api/v1/company/me" token={token} schemaOverride={null} />
function SchemaEngine({ route, dataSource, token, dataMapper, schemaOverride, onNavigate }) {
  const [renderState, setRenderState] = useState({ ui: null, data: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUiAndData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let schema = schemaOverride;

      // Only fetch schema from backend if no override given
      if (!schema) {
        if (!route) {
          setLoading(false);
          return;
        }
        
        let uiUrl = `/ui/layout?route=${route}`;
        const uiRes = await api.get(uiUrl);
        schema = uiRes.data.schema;
      }

      // Only fetch page data if a dataSource is explicitly provided
      let providedData = null;
      if (dataSource) {
        let cleanDataUrl = dataSource.trim();
        // 1. Strip domain if present
        cleanDataUrl = cleanDataUrl.replace(/^https?:\/\/[^\/]+/, ''); 
        
        // 2. Aggressively remove /api/v1 or api/v1 prefix to avoid doubling with baseURL
        cleanDataUrl = cleanDataUrl.replace(/^\/?api\/v1/, '');
        
        // 3. Ensure single leading slash
        if (!cleanDataUrl.startsWith('/')) cleanDataUrl = '/' + cleanDataUrl;
        
        const dataRes = await api.get(cleanDataUrl);
        providedData = dataRes.data;
        console.log(`[SchemaEngine] Context Data Fetched (${cleanDataUrl}):`, providedData);
        if (dataMapper) {
          providedData = dataMapper(providedData);
          console.log(`[SchemaEngine] Data Transformation Applied:`, providedData);
        }
      }

      const boundUI = providedData ? bindData(schema, providedData) : schema;
      console.log(`[SchemaEngine] Final Data-Bound UI Structure:`, boundUI);
      
      setRenderState({
        ui: boundUI,
        data: providedData || {}
      });
    } catch (err) {
      console.error('[SchemaEngine Error Detail]', {
        url: err.config?.url,
        status: err.response?.status,
        data: err.response?.data,
        msg: err.message
      });
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown protocol error';
      setError(err.response?.status === 401 
        ? 'Session Authorization Required: ' + errMsg 
        : 'Failed to load page architecture: ' + errMsg
      );
    } finally {
      setLoading(false);
    }
  }, [token, route, dataSource, dataMapper, schemaOverride]);

  useEffect(() => {
    fetchUiAndData();
  }, [fetchUiAndData]);

  // Apply theme background if present in data
  useEffect(() => {
    const themeBg = renderState.data?.theme_bg_color;
    if (themeBg) {
      document.body.style.backgroundColor = themeBg;
    } else {
      document.body.style.backgroundColor = '#f3f4f6'; // default
    }
    return () => {
      document.body.style.backgroundColor = '';
    }
  }, [renderState.data]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mb-4" style={{ borderColor: 'var(--theme-primary)' }}></div>
        <p className="font-bold text-xs uppercase tracking-widest animate-pulse" style={{ color: 'var(--theme-primary)' }}>Syncing Remote Metadata...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[300px] px-8 text-center bg-rose-50/30 rounded-2xl border border-rose-100/50 m-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p className="text-rose-600 font-bold mb-2 text-sm uppercase tracking-tight">{error}</p>
        <button 
          onClick={fetchUiAndData}
          className="mt-2 text-xs font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest underline decoration-2 underline-offset-4"
        >
          Attempt Force Re-sync
        </button>
      </div>
    );
  }

  const { ui, data } = renderState;

  if (!ui || !ui.components) {
    if (loading) return null; // Wait for loader
    return <div className="flex justify-center items-center px-4 py-8 text-gray-400">No layout configured for this page.</div>;
  }

  return (
    <div className="w-full space-y-4">
      {ui.components.map((component, index) => {
          const Component = componentMap[component.type];
          if (!Component) {
              console.warn(`Unknown component type: ${component.type}`);
              return <div key={index} className="text-red-500 p-4 border border-red-500 my-2 rounded">Unknown component type: {component.type}</div>;
          }
          const blockStyle = component.config?.style || {};
          const isComponentSelfData = !!(component.config?.dataSource && component.config.dataSource !== '');
          
          console.log(`[SchemaEngine] Rendering ${component.type}:`, {
            hasSelfData: isComponentSelfData,
            dataSource: component.config?.dataSource,
            passingData: isComponentSelfData ? 'LOCAL_ONLY' : 'GLOBAL_CONTEXT'
          });

          return (
              <div key={component.id || index} style={blockStyle}>
                  <Component 
                    config={component.config} 
                    theme={data} 
                    providedData={data} // Always provide global context as baseline
                    token={token} 
                    onNavigate={onNavigate} 
                    currentRoute={route}
                  />
              </div>
          );
      })}
    </div>
  );
}

export default SchemaEngine;

