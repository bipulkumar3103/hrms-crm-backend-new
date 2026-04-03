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

const getValue = (obj, path) => path.split('.').reduce((o, p) => (o ? o[p] : null), obj);

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
  const [uiStructure, setUiStructure] = useState(null);
  const [pageData, setPageData] = useState(null);
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
        const uiRes = await api.get(uiUrl, {
          headers: { Authorization: `Bearer ${token?.trim()}` }
        });
        schema = uiRes.data.schema;
      }

      // Only fetch page data if a dataSource is explicitly provided
      let providedData = null;
      if (dataSource) {
        let cleanDataUrl = dataSource.trim();
        // 1. Strip domain if present
        cleanDataUrl = cleanDataUrl.replace(/^https?:\/\/[^\/]+/, ''); 
        
        // 2. Aggressively remove /api/v1 or api/v1 prefix
        if (cleanDataUrl.startsWith('/api/v1')) cleanDataUrl = cleanDataUrl.replace('/api/v1', '');
        else if (cleanDataUrl.startsWith('api/v1')) cleanDataUrl = cleanDataUrl.replace('api/v1', '');
        
        // 3. Ensure single leading slash
        if (!cleanDataUrl.startsWith('/')) cleanDataUrl = '/' + cleanDataUrl;
        
        const dataRes = await api.get(cleanDataUrl, {
          headers: { Authorization: `Bearer ${token?.trim()}` }
        });
        providedData = dataRes.data;
        if (dataMapper) {
          providedData = dataMapper(providedData);
        }
      }

      const boundUI = providedData ? bindData(schema, providedData) : schema;
      console.log(`[SchemaEngine] Final Bound UI:`, boundUI);
      setUiStructure(boundUI);
      setPageData(providedData || {});
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError('Failed to load page: ' + errMsg);
      console.error('[SchemaEngine Error]', err);
    } finally {
      setLoading(false);
    }
  }, [token, route, dataSource, dataMapper, schemaOverride]);

  useEffect(() => {
    fetchUiAndData();
  }, [fetchUiAndData, token]);

  // Apply theme background if present in data
  useEffect(() => {
    if (pageData?.theme_bg_color) {
      document.body.style.backgroundColor = pageData.theme_bg_color;
    } else {
      document.body.style.backgroundColor = '#f3f4f6'; // default
    }
    return () => {
      document.body.style.backgroundColor = '';
    }
  }, [pageData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center items-center px-4 py-8"><p className="text-red-500 font-semibold">{error}</p></div>;
  }

  if (!uiStructure || !uiStructure.components) {
    return <div className="flex justify-center items-center px-4 py-8 text-gray-400">No layout configured for this page.</div>;
  }

  return (
    <div className="w-full space-y-4">
      {uiStructure.components.map((component, index) => {
          const Component = componentMap[component.type];
          if (!Component) {
              console.warn(`Unknown component type: ${component.type}`);
              return <div key={index} className="text-red-500 p-4 border border-red-500 my-2 rounded">Unknown component type: {component.type}</div>;
          }
          const blockStyle = component.config?.style || {};
          return (
              <div key={component.id || index} style={blockStyle}>
                                   <Component 
                    config={component.config} 
                    theme={pageData} 
                    providedData={component.config?.dataSource ? null : pageData}
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

