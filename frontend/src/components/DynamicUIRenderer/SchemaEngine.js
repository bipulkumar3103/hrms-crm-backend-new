import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import Header from '../dynamic/Header';
import Card from '../dynamic/Card';
import Table from '../dynamic/Table';
import Button from '../dynamic/Button';
import DynamicForm from '../dynamic/DynamicForm';
import Container from '../dynamic/Container';

const componentMap = {
  header: Header,
  card: Card,
  table: Table,
  button: Button,
  form: DynamicForm,
  container: Container,
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
          className="mt-2 text-xs font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest underline decoration-2 underline-offset-4"
        >
          Attempt Force Re-sync
        </button>
      </div>
    );
  }

  const DataScopedWrapper = ({ component, contextData, token, onNavigate, route, children }) => {
    const [localData, setLocalData] = useState(null);
    const [loading, setLoading] = useState(false);
    const dataSource = component.config?.dataSource;

    useEffect(() => {
      if (dataSource && dataSource.trim() !== '') {
        const fetchData = async () => {
          try {
            setLoading(true);
            let cleanUrl = dataSource.trim().replace(/^https?:\/\/[^\/]+/, '').replace(/^\/?api\/v1/, '');
            if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
            
            const res = await api.get(cleanUrl);
            setLocalData(res.data);
          } catch (err) {
            console.warn(`[DataScopedWrapper] Failed to fetch data for ${component.type}:`, err);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    }, [dataSource]);

    const activeData = localData || contextData;
    const Component = componentMap[component.type];

    if (!Component) return null;

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8 opacity-50">
           <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <Component 
        config={component.config} 
        theme={activeData} 
        providedData={activeData} 
        token={token} 
        onNavigate={onNavigate} 
        currentRoute={route}
      >
        {children(activeData)}
      </Component>
    );
  };

  const RenderComponents = ({ components, contextData, token, onNavigate, route }) => {
    if (!components || !Array.isArray(components)) return null;

    return (
      <>
        {components.map((component, index) => {
          const blockStyle = component.config?.style || {};
          
          return (
            <div key={component.id || index} style={blockStyle}>
              <DataScopedWrapper 
                component={component}
                contextData={contextData}
                token={token}
                onNavigate={onNavigate}
                route={route}
              >
                {(scopedData) => (
                  <RenderComponents 
                    components={component.components} 
                    contextData={scopedData} 
                    token={token}
                    onNavigate={onNavigate}
                    route={route}
                  />
                )}
              </DataScopedWrapper>
            </div>
          );
        })}
      </>
    );
  };

  const { ui, data } = renderState;

  if (!ui || !ui.components) {
    if (loading) return null;
    return <div className="flex justify-center items-center px-4 py-8 text-gray-400">No layout configured for this page.</div>;
  }

  return (
    <div className="w-full space-y-4">
      <RenderComponents 
        components={ui.components} 
        contextData={data} 
        token={token} 
        onNavigate={onNavigate} 
        route={route} 
      />
    </div>
  );
}

export default SchemaEngine;

