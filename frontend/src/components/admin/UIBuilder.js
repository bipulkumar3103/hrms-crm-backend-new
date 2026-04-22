import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import SchemaEngine from '../DynamicUIRenderer/SchemaEngine';
import { useAlert } from '../../context/AlertContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiLayout, FiTrash2, FiPlusCircle, FiCheck, FiSettings, FiZap, FiMoreVertical, FiBox, FiType } from 'react-icons/fi';

/**
 * Deep-flatten an object into dot-notated paths (e.g. user.profile.name)
 */
const flattenObject = (obj, prefix = '') => {
  if (obj === null || typeof obj !== 'object') return { [prefix]: obj };
  
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

function UIBuilder() {
  const { token } = useAuth();
  const { showAlert } = useAlert();
  const { confirm } = useConfirmation();
  const [activeView, setActiveView] = useState('builder'); // 'builder' | 'submissions'
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Editor specific
  const [editMode, setEditMode] = useState(false);
  const [schemaText, setSchemaText] = useState('');
  
  // New Route Modal
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');

  // Component Config Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configType, setConfigType] = useState('');
  const [configFormData, setConfigFormData] = useState({});
  const [configFormFields, setConfigFormFields] = useState([]); // Array to hold visual field config
  const [configTableColumns, setConfigTableColumns] = useState([]); // Dynamic columns for tables
  const [availablePaths, setAvailablePaths] = useState([]); // Discovered from API
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [modalTab, setModalTab] = useState('data'); // 'data' | 'columns' | 'style'

  // Form Submissions Viewer
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsFilter, setSubmissionsFilter] = useState('');
  const [expandedSubId, setExpandedSubId] = useState(null);

  const fetchSubmissions = async (filter = '') => {
    setSubmissionsLoading(true);
    try {
      const url = filter
        ? `/forms/submissions?form_name=${encodeURIComponent(filter)}`
        : '/forms/submissions';
      const res = await api.get(url);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'submissions') fetchSubmissions(submissionsFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const handleDeleteSubmission = async (id, sub) => {
    const isConfirmed = await confirm({
        title: 'Purge Form Submission',
        message: `You are about to permanently remove a record submitted by ${sub.submitter_name}. This action will dismantle the entry from the Enterprise Framework and cannot be reversed.`
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/forms/submissions/${id}`);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch {
      showAlert({ 
        title: 'Purge Failed', 
        message: 'The system encountered an error while attempting to dismantle the submission record.', 
        type: 'error' 
      });
    }
  };

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await api.get('/ui/builder/layouts');
      const fetchedRoutes = res.data.routes || [];
      setRoutes(fetchedRoutes);
      
      // Auto-set selected route if not set
      if (!selectedRoute && fetchedRoutes.length > 0) {
        const dashboardExists = fetchedRoutes.find(r => (typeof r === 'object' ? r.path : r) === '/employee/dashboard');
        setSelectedRoute(dashboardExists ? '/employee/dashboard' : (typeof fetchedRoutes[0] === 'object' ? fetchedRoutes[0].path : fetchedRoutes[0]));
      }
    } catch (err) {
      console.error("Failed to load routes", err);
      // Fallback suggestions for a functional UI even on backend failure
      const fallbackRoutes = [
        { path: '/employee/dashboard', is_custom: false, has_global: true },
        { path: '/employee/profile', is_custom: false, has_global: false },
        { path: '/employee/reports', is_custom: false, has_global: false }
      ];
      setRoutes(fallbackRoutes);
      if (!selectedRoute) setSelectedRoute('/employee/dashboard');
    }
  }, [token, selectedRoute]);

  useEffect(() => {
    if (token) fetchRoutes();
  }, [token, fetchRoutes]);

  useEffect(() => {
    const fetchLayout = async () => {
      if (!selectedRoute) return;
      setLoading(true);
      try {
        const res = await api.get(`/ui/layout?route=${selectedRoute}`);
        setSchema(res.data.schema);
        setSchemaText(JSON.stringify(res.data.schema, null, 2));
      } catch (err) {
        if (err.response?.status === 404) {
             setSchema({ components: [] });
             setSchemaText(JSON.stringify({ components: [] }, null, 2));
        }
        console.error("Failed to fetch layout", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [selectedRoute, token]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      let payloadSchema = schema || { components: [] };
      if (editMode) {
        try {
          payloadSchema = JSON.parse(schemaText);
          setSchema(payloadSchema);
        } catch (e) {
          showAlert({ title: 'Syntax Error', message: 'Invalid JSON architecture detected. Please check your schema formatting.', type: 'error' });
          return;
        }
      }

      await api.post('/ui/builder/layout', {
        route: selectedRoute,
        schema: payloadSchema
      });
      setMessage({ text: 'Layout saved effectively! Employees can now see this configuration.', type: 'success' });
      
      // Update local routes state to reflect 'custom' status immediately
      const routeIdx = routes.findIndex(r => (typeof r === 'object' ? r.path : r) === selectedRoute);
      if (routeIdx === -1) {
          setRoutes(prev => [...prev, { path: selectedRoute, is_custom: true, has_global: false }]);
      } else {
          setRoutes(prev => prev.map((r, i) => 
              i === routeIdx 
              ? { ...(typeof r === 'object' ? r : { path: r }), is_custom: true }
              : r
          ));
      }

      // Re-fetch in background to keep all metadata (global vs custom) in sync with DB
      fetchRoutes();
    } catch (err) {
      setMessage({ text: 'Failed to save layout. ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    
    const routeMeta = routes.find(r => r.path === selectedRoute) || {};
    const hasGlobal = routeMeta.has_global;

    const isConfirmed = await confirm({
        title: hasGlobal ? 'Reset to Architecture' : 'Deconstruct Protocol Layout',
        message: hasGlobal 
            ? `Confirming this request will dismantle your custom overwrite for "${selectedRoute}" and instantly restore the Enterprise Elite Default configuration.`
            : `Confirming this request will destroy the custom administrative interface for "${selectedRoute}". All regional workforce interactions on this route will revert to global system defaults.`
    });

    if (!isConfirmed) return;
    try {
      setLoading(true);
      await api.delete(`/ui/builder/layout?route=${selectedRoute}`);
      setMessage({ text: 'Layout deleted successfully! Employees will now see the default interface.', type: 'success' });
      
      // Remove from routes dropdown if missing
      setRoutes(routes.filter(r => r !== selectedRoute));
      
      // Render Empty
      setSchema({ components: [] });
      setSchemaText(JSON.stringify({ components: [] }, null, 2));
      
      // Auto-load first generic
      if (routes.length > 0) setSelectedRoute(routes[0]);
    } catch (err) {
      setMessage({ text: 'Failed to delete layout.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewRoute = (e) => {
      e.preventDefault();
      const route = newRouteName.trim();
      
      if (!route.startsWith('/')) {
          showAlert({ 
            title: 'Protocol Violation', 
            message: 'All custom routes must begin with a leading slash (/), e.g., /employee/portal.', 
            type: 'warning' 
          });
          return;
      }

      // Check if route already exists in the company's list
      if (routes.includes(route)) {
          showAlert({ 
            title: 'Registry Conflict', 
            message: `The path "${route}" is already registered. Redirecting to existing architecture.`, 
            type: 'info' 
          });
          setSelectedRoute(route);
          setIsNewRouteModalOpen(false);
          setNewRouteName('');
          return;
      }

      // It's a new route: add it to the local list and switch
      setRoutes(prev => [...prev, route].sort());
      setSelectedRoute(route);
      setSchema({ components: [] });
      setSchemaText(JSON.stringify({ components: [] }, null, 2));
      setIsNewRouteModalOpen(false);
      setNewRouteName('');
  };

  const openConfigModal = (type) => {
      setConfigType(type);
      setModalTab('data'); // Reset to first tab
      if (type === 'button') setConfigFormData({ label: 'Open Page', targetRoute: '/employee/reports' });
      else if (type === 'table') {
          setConfigFormData({ title: 'Employee Directory', dataSource: '/api/v1/employees', borderColor: '#4f46e5', borderWidth: '1px', shadow: 'sm', borderRadius: '26px' });
          setConfigTableColumns([{ header: "Name", bind: "name" }, { header: "Department", bind: "department" }]);
          setAvailablePaths([]);
      }
      else if (type === 'header') {
          setConfigFormData({ 
              title: 'Dashboard Header', 
              subtitle: 'Manage your tasks',
              dataSource: '',
              alignment: 'left',
              backgroundType: 'solid',
              padding: '2.5rem',
              shadow: 'none',
              titleSize: '2.25rem',
              titleWeight: '900',
              subtitleSize: '1.1rem',
              subtitleWeight: '500'
          });
          setAvailablePaths([]);
      }
      else if (type === 'card') {
          setConfigFormData({ 
              title: 'Data Container',
              subtitle: '',
              dataSource: '',
              layout: 'vertical',
              backgroundType: 'solid',
              shadow: 'md',
              padding: '1.5rem',
              titleSize: '1.25rem',
              titleColor: '#1e293b',
              subtitleSize: '0.875rem',
              subtitleColor: '#64748b',
              fields: []
          });
          setAvailablePaths([]);
      }
      else if (type === 'form') {
          setConfigFormData({ title: 'Submit Request', submitEndpoint: '/api/v1/forms/submit', submitLabel: 'Submit Data' });
          setConfigFormFields([{ id: Date.now(), name: "message", label: "Your Message", type: "textarea", required: true }]);
      }
      else setConfigFormData({});
      
      setConfigFormData(prev => ({...prev, padding: '', margin: '', width: ''}));
      setIsConfigModalOpen(true);
  };

  const discoverTableSchema = async () => {
    if (!configFormData.dataSource) return;
    setIsFetchingSchema(true);
    try {
      // Endpoint Normalization: Prepend /api/v1 if not present
      let endpoint = configFormData.dataSource.trim();
      // Only prefix if it's a relative path and doesn't already have the base
      if (!endpoint.startsWith('http') && !endpoint.startsWith('/api/v1') && !endpoint.startsWith('api/v1')) {
          endpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
      } else {
          // If it already has /api/v1, strip it so the 'api' utility (which has /api/v1 baseURL) doesn't double it
          endpoint = endpoint.replace(/^\/?api\/v1/, '');
          if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
      }

      // 1. Fetch raw data using the centralized api utility
      const res = await api.get(endpoint);
      
      // 2. Intelligent Data Discovery
      let sampleObject = null;
      const data = res.data;

      if (Array.isArray(data)) {
        // Find the first object in the array (not a string/number)
        sampleObject = data.find(item => item && typeof item === 'object' && !Array.isArray(item));
      } else if (data && typeof data === 'object') {
        // If it's a single object (like /users/me), check if it's a wrapper (e.g. { users: [...] })
        const potentialArrays = Object.values(data).filter(v => 
            Array.isArray(v) && v.length > 0 && typeof v[0] === 'object'
        );
        
        if (potentialArrays.length > 0) {
            sampleObject = potentialArrays[0][0];
        } else {
            // It's a single flat object
            sampleObject = data;
        }
      }

      if (sampleObject && typeof sampleObject === 'object') {
        const flat = flattenObject(sampleObject);
        // Exclude internal React or metadata fields if any
        const discoveredPaths = Object.keys(flat).filter(key => 
            !key.startsWith('__') && !['password', 'salt'].includes(key.toLowerCase())
        );
        setAvailablePaths(discoveredPaths);
        showAlert({ 
            title: 'Scanner Complete', 
            message: `Successfully mapped ${discoveredPaths.length} unique data-paths from the remote endpoint.`, 
            type: 'success' 
        });
      } else {
        showAlert({ 
            title: 'Discovery Failed', 
            message: 'No structured data records were detected at this API endpoint. Verify the source permissions.', 
            type: 'error' 
        });
      }
    } catch (err) {
      console.error("[UI Discovery Error]", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      showAlert({ 
        title: 'Network Sync Error', 
        message: `Remote handshake failed: ${msg}`, 
        type: 'error' 
      });
    } finally {
      setIsFetchingSchema(false);
    }
  };

  const handleUpdateColumn = (idx, key, val) => {
    const updated = [...configTableColumns];
    updated[idx][key] = val;
    setConfigTableColumns(updated);
  };

  const handleAddColumn = () => {
    setConfigTableColumns([...configTableColumns, { header: "New Column", bind: "" }]);
  };

  const handleRemoveColumn = (idx) => {
    setConfigTableColumns(configTableColumns.filter((_, i) => i !== idx));
  };

  const UIBlockTemplates = {
    header: { id: "new-header", type: "header", config: { title: "New Header", subtitle: "Subtitle", dataSource: "", alignment: "left", backgroundType: "solid" } },
    card: { id: "new-card", type: "card", config: { title: "New Card", elements: [], children: [] } },
    table: { id: "new-table", type: "table", config: { title: "New Table", dataSource: "/api/v1/employees", columns: [{header: "Name", bind: "name"}, {header: "Department", bind: "department"}] } },
    button: { id: "new-button", type: "button", config: { label: "Navigate", targetRoute: "/"} },
    form: { id: "new-form", type: "form", config: { title: "New Form", submitEndpoint: "/api/v1/forms/submit", submitLabel: "Submit Data", fields: [] } }
  };

  const handleAddField = () => {
      setConfigFormFields([...configFormFields, { id: Date.now(), name: '', label: '', type: 'text', required: false }]);
  }

  const handleRemoveField = (id) => {
      setConfigFormFields(configFormFields.filter(f => f.id !== id));
  }

  const updateField = (id, key, value) => {
      setConfigFormFields(configFormFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  }

  const commitBlock = (e) => {
      e.preventDefault();
      if (!schema) return;
      const newSchema = { ...schema };
      const block = { ...UIBlockTemplates[configType], id: `${configType}-${Date.now()}` };
      
      // Apply form overrides
      if (configType === 'button') {
          block.config.label = configFormData.label;
          block.config.targetRoute = configFormData.targetRoute;
      } else if (configType === 'table') {
          // Normalize Data Source: Strip domain and /api/v1, ensure leading slash
          let ds = (configFormData.dataSource || '').trim();
          ds = ds.replace(/^https?:\/\/[^\/]+/, ''); // remove domain
          if (ds.startsWith('/api/v1')) ds = ds.replace('/api/v1', '');
          else if (ds.startsWith('api/v1')) ds = ds.replace('api/v1', '');
          
          if (!ds.startsWith('/')) ds = '/' + ds;
          
          block.config.title = configFormData.title;
          block.config.dataSource = ds;
          block.config.columns = configTableColumns;
          // Apply advanced styles
          block.config.style = {
            borderColor: configFormData.borderColor,
            borderWidth: configFormData.borderWidth,
            borderRadius: configFormData.borderRadius,
            shadow: configFormData.shadow
          };
      } else if (configType === 'header') {
          block.config = {
              ...block.config,
              ...configFormData,
              // Explicitly ensuring fields aren't lost if they exist
              style: {
                  ...block.config.style,
                  padding: configFormData.padding,
                  margin: configFormData.margin,
                  width: configFormData.width
              }
          };
      } else if (configType === 'card') {
          block.config = {
              ...block.config,
              ...configFormData,
              style: {
                  ...block.config.style,
                  padding: configFormData.padding,
                  margin: configFormData.margin,
                  width: configFormData.width
              }
          };
      } else if (configType === 'form') {
          block.config.title = configFormData.title;
          block.config.submitEndpoint = configFormData.submitEndpoint;
          block.config.submitLabel = configFormData.submitLabel;
          // Strip out the internal UI 'id' and preserve the custom fields
          block.config.fields = configFormFields.map(({ id, ...rest }) => rest);
      }

      // Apply styles
      block.config.style = block.config.style || {};
      if (configFormData.padding) block.config.style.padding = configFormData.padding;
      if (configFormData.margin) block.config.style.margin = configFormData.margin;
      if (configFormData.width) block.config.style.width = configFormData.width;

      newSchema.components = [...(newSchema.components || []), block];
      setSchema(newSchema);
      setSchemaText(JSON.stringify(newSchema, null, 2));
      setIsConfigModalOpen(false);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button 
          onClick={() => setActiveView('builder')}
          className="px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm"
          style={{ 
            backgroundColor: activeView === 'builder' ? 'var(--theme-primary)' : 'white', 
            color: activeView === 'builder' ? 'white' : '#6b7280'
          }}
        >
          Layout Builder
        </button>
        <button 
          onClick={() => setActiveView('submissions')}
          className="px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm"
          style={{ 
            backgroundColor: activeView === 'submissions' ? 'var(--theme-primary)' : 'white', 
            color: activeView === 'submissions' ? 'white' : '#6b7280'
          }}
        >
          Form Submissions
        </button>
      </div>

      {activeView === 'builder' ? (
        <>
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 gap-6">
            <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <div className="p-2 rounded-xl text-white shadow-lg" style={{ backgroundColor: 'var(--theme-primary)' }}>
                    <FiLayout size={20} />
                  </div>
                  Enterprise Layout Builder
                </h1>
                <p className="text-gray-500 text-sm mt-1.5 font-medium ml-1">Design and deploy custom interfaces for your workforce.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
              {/* Route Management Group */}
              <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-[1.25rem] border border-gray-100 flex-1 md:flex-none">
                <div className="relative flex-1 md:w-64 group">
                  <select 
                      value={selectedRoute} 
                      onChange={e => setSelectedRoute(e.target.value)}
                      className="w-full appearance-none font-bold text-gray-700 bg-transparent px-4 py-2 pr-10 focus:outline-none transition-all text-sm cursor-pointer"
                  >
                      {Array.isArray(routes) && routes.map(r => {
                        const path = typeof r === 'object' ? r.path : r;
                        const isCustom = typeof r === 'object' ? r.is_custom : false;
                        const hasGlobal = typeof r === 'object' ? r.has_global || r.is_global : false;
                        
                        let label = path;
                        if (isCustom) label += " (Custom)";
                        else if (hasGlobal) label += " (Elite Default)";

                        return <option key={path} value={path}>{label}</option>;
                      })}
                      {selectedRoute && Array.isArray(routes) && !routes.find(r => (typeof r === 'object' ? r.path : r) === selectedRoute) && (
                          <option value={selectedRoute}>{selectedRoute} (Unsaved)</option>
                      )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-[var(--theme-primary)] transition-colors">
                       <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                
                <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

                <button 
                  onClick={() => setIsNewRouteModalOpen(true)}
                  title="Create New Route"
                  className="p-2.5 text-[var(--theme-primary)] hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90"
                >
                  <FiPlusCircle size={22} />
                </button>
                
                <button 
                  onClick={handleDelete}
                  title="Delete Layout"
                  className="p-2.5 text-rose-500 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90"
                >
                  <FiTrash2 size={22} />
                </button>
              </div>

              {/* Publish Action */}
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 md:flex-none text-white font-bold py-3.5 px-10 rounded-[1.25rem] shadow-xl disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-3 active:translate-y-1"
                style={{ 
                    backgroundColor: 'var(--theme-primary)',
                    boxShadow: '0 10px 30px -5px var(--theme-primary-border)'
                }}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="tracking-wide">SYNCHRONIZING...</span>
                  </>
                ) : (
                  <>
                    <FiZap size={18} className="text-amber-300 fill-amber-300" />
                    <span className="tracking-wide">PUBLISH LAYOUT</span>
                  </>
                )}
              </button>
            </div>
          </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Editor Panel */}
        <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Drag/Add Blocks</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => openConfigModal('header')} className="bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all shadow-sm hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/20">Header</button>
              <button onClick={() => openConfigModal('card')} className="bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all shadow-sm hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/20">Data Container</button>
              <button onClick={() => openConfigModal('table')} className="bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all shadow-sm hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/20">Data Table</button>
              <button onClick={() => openConfigModal('button')} className="bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all shadow-sm hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/20">Action Link</button>
              <button onClick={() => openConfigModal('form')} className="col-span-2 font-semibold py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center" style={{ backgroundColor: 'var(--theme-secondary)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>Entry Form</button>
            </div>
            <div className="flex justify-between items-center bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl border-t border-gray-100">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Developer Options</span>
              <button 
                onClick={() => setEditMode(!editMode)} 
                className="text-[var(--theme-primary)] text-sm font-semibold hover:opacity-80 transition-colors"
              >
                {editMode ? 'Hide Code' : 'Show Code'}
              </button>
            </div>
          </div>

          {editMode && (
            <div className="flex-grow flex flex-col bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                      </div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-2">Schema Architect</span>
                  </div>
                    <button 
                      onClick={() => {
                          const text = JSON.stringify(schema, null, 2);
                          navigator.clipboard.writeText(text);
                          showAlert({ 
                              title: 'Metadata Exported', 
                              message: 'The layout architecture has been successfully synchronized to your clipboard buffer.', 
                              type: 'success' 
                          });
                      }}
                    className="text-[10px] font-bold text-[var(--theme-primary)] hover:opacity-80 transition-colors uppercase tracking-widest"
                  >
                    Copy JSON
                  </button>
              </div>
              <div className="relative group">
                  <textarea 
                    value={schemaText}
                    onChange={e => setSchemaText(e.target.value)}
                    className="w-full h-[500px] font-mono text-[12px] bg-transparent text-[var(--theme-primary)] p-6 focus:outline-none resize-none leading-relaxed custom-dark-scrollbar"
                    spellCheck="false"
                  />
                  <div className="absolute bottom-4 right-4 px-2 py-1 bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 rounded text-[9px] font-bold text-[var(--theme-primary)] uppercase tracking-widest backdrop-blur-sm">
                      Live Sync Active
                  </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
            .custom-dark-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-dark-scrollbar::-webkit-scrollbar-track {
                background: #0f172a;
            }
            .custom-dark-scrollbar::-webkit-scrollbar-thumb {
                background: #1e293b;
                border-radius: 10px;
            }
            .custom-dark-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #334155;
            }
        `}</style>

        {/* Live Preview Panel */}
        <div className="w-full lg:flex-1">
          <div className="bg-white rounded-2xl shadow-sm min-h-[700px] border border-gray-200 relative flex flex-col">
             <div className="h-12 bg-gray-100 border-b border-gray-200 rounded-t-2xl flex items-center px-4 justify-between">
                 <div className="flex space-x-2">
                     <div className="w-3 h-3 rounded-full bg-red-400"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                     <div className="w-3 h-3 rounded-full bg-green-400"></div>
                 </div>
                 <div className="bg-white px-4 py-1 rounded text-xs font-mono text-gray-500 border border-gray-200 shadow-sm grow max-w-sm mx-4 text-center truncate pointer-events-none">
                     {window.location.origin}{selectedRoute}
                 </div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-4">Live Preview</div>
             </div>
             
             <div className="flex-1 relative overflow-auto bg-gray-50/50 p-4 md:p-8">
                 {loading ? (
                   <div className="flex justify-center items-center h-full text-indigo-400 font-medium animate-pulse">Synchronizing Interface...</div>
                 ) : schema ? (
                    <div className="pointer-events-none border border-dashed border-indigo-200 p-2 rounded-xl bg-white shadow-sm min-h-full">
                        <SchemaEngine 
                            route={selectedRoute} 
                            dataSource="/api/v1/ui/context" 
                            token={token} 
                            schemaOverride={schema}
                            onNavigate={() => {}} // Disabled in preview
                        />
                    </div>
                 ) : (
                    <div className="flex justify-center items-center h-full text-gray-400">Select or create a route to begin building.</div>
                 )}
             </div>
          </div>
        </div>

          </div>
        </>
      ) : (
        /* Submissions View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Form Submissions</h2>
              <p className="text-sm text-gray-500">View and manage data submitted by employees via dynamic forms.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Filter by Form Name..." 
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-sm"
                value={submissionsFilter}
                onChange={e => setSubmissionsFilter(e.target.value)}
              />
              <button 
                onClick={() => fetchSubmissions(submissionsFilter)}
                className="w-full sm:w-auto bg-[var(--theme-primary)] text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:opacity-90 shadow-md"
                style={{ boxShadow: '0 8px 20px -4px var(--theme-primary-border)' }}
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {submissionsLoading ? (
              <div className="p-12 text-center text-gray-500 animate-pulse">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic">No submissions found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4 border-b border-gray-100 min-w-[150px]">Submitted By</th>
                    <th className="px-6 py-4 border-b border-gray-100 min-w-[140px]">Form Name</th>
                    <th className="px-6 py-4 border-b border-gray-100 min-w-[160px]">Endpoint</th>
                    <th className="px-6 py-4 border-b border-gray-100 min-w-[140px]">Source Page</th>
                    <th className="px-6 py-4 border-b border-gray-100 min-w-[180px]">Date</th>
                    <th className="px-6 py-4 border-b border-gray-100 text-right min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map(sub => (
                    <React.Fragment key={sub.id}>
                      <tr className="hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)]/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">{sub.submitter_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                          <span className="bg-[var(--theme-secondary)] text-[var(--theme-primary)] px-2.5 py-1 rounded-lg text-xs font-bold border border-[var(--theme-primary)]/10 whitespace-nowrap">{sub.form_name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-200 whitespace-nowrap">/forms/{sub.form_slug || 'submit'}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{sub.source_route}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(sub.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setExpandedSubId(expandedSubId === sub.id ? null : sub.id)}
                            className="text-[var(--theme-primary)] font-bold text-xs hover:underline mr-4"
                          >
                            {expandedSubId === sub.id ? 'Hide Data' : 'View Data'}
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(sub.id, sub)}
                            className="text-red-500 font-bold text-xs hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedSubId === sub.id && (
                        <tr className="bg-gray-50">
                          <td colSpan="5" className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {Object.entries(sub.data).map(([key, value]) => (
                                <div key={key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{key}</label>
                                  <div className="text-gray-800 font-medium whitespace-pre-wrap">{String(value)}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* New Route Modal */}
      {isNewRouteModalOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create New UI Route</h3>
                  <p className="text-sm text-gray-500 mb-6">Define a custom path that employees can navigate to.</p>
                  <form onSubmit={handleCreateNewRoute}>
                      <input 
                          type="text" 
                          required 
                          placeholder="/employee/settings" 
                          className="w-full px-4 py-3 bg-gray-50 font-mono text-sm border border-gray-200 rounded-xl mb-6 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                          value={newRouteName}
                          onChange={e => setNewRouteName(e.target.value)}
                      />
                      <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setIsNewRouteModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-[var(--theme-secondary)] hover:text-[var(--theme-primary)] rounded-lg">Cancel</button>
                          <button type="submit" className="px-4 py-2 font-bold text-white bg-[var(--theme-primary)] hover:opacity-90 rounded-lg shadow-sm">Create Route</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Block Config Modal */}
      {isConfigModalOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-full md:max-w-md border border-gray-100 flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 capitalize">Configure {configType} Block</h3>
                  <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">Set the initial parameters for this component.</p>
                  
                  <form onSubmit={commitBlock} className="flex flex-col flex-1 min-h-0">
                      <div className="flex-1 overflow-y-auto pr-2 min-h-0 pb-4 space-y-5">
                          {configType === 'button' && (
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">Button Label</label>
                                      <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                          value={configFormData.label || ''} onChange={e => setConfigFormData({...configFormData, label: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">Destination Path</label>
                                      <input type="text" placeholder="/employee/..." className="w-full font-mono text-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                          value={configFormData.targetRoute || ''} onChange={e => setConfigFormData({...configFormData, targetRoute: e.target.value})} />
                                  </div>
                              </div>
                          )}

                          {configType === 'table' && (
                             <div className="space-y-5">
                                 {/* Tab Navigation (Integrated & Sticky) */}
                                 <div className="flex border-b border-gray-100 mb-4 sticky top-0 bg-white z-20 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                     {[
                                         { id: 'data', label: 'Data', icon: <FiSearch /> },
                                         { id: 'columns', label: 'Columns', icon: <FiLayout /> },
                                         { id: 'style', label: 'Styles', icon: <FiSettings /> }
                                     ].map(tab => (
                                         <button 
                                             key={tab.id}
                                             type="button"
                                             onClick={() => setModalTab(tab.id)}
                                             className={`flex items-center gap-2 px-4 py-3 text-xs font-black transition-all border-b-2 ${modalTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                         >
                                             {tab.icon}
                                             {tab.label}
                                         </button>
                                     ))}
                                 </div>

                                 {modalTab === 'data' && (
                                     <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                         <div>
                                             <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Endpoint Linkage</label>
                                             <div className="flex gap-2">
                                                 <input type="text" placeholder="/api/v1/..." className="flex-1 font-mono text-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                                                     value={configFormData.dataSource || ''} onChange={e => setConfigFormData({...configFormData, dataSource: e.target.value})} />
                                                 <button type="button" onClick={discoverTableSchema} disabled={isFetchingSchema} className="px-5 py-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 flex items-center transition-all">
                                                     {isFetchingSchema ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <FiSearch className="mr-2" />}
                                                     Scan
                                                 </button>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Display Title</label>
                                             <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white outline-none" 
                                                 value={configFormData.title || ''} onChange={e => setConfigFormData({...configFormData, title: e.target.value})} />
                                         </div>
                                         {availablePaths.length > 0 && (
                                             <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                                 <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><FiCheck /></div>
                                                 <div className="text-xs text-emerald-800 font-bold uppercase tracking-tight">API Scanned: {availablePaths.length} Fields Discovered</div>
                                             </div>
                                         )}
                                     </div>
                                 )}

                                 {modalTab === 'columns' && (
                                     <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                         <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl mb-2 border border-gray-100">
                                             <span className="text-[10px] font-bold text-gray-900 uppercase">Registered Columns</span>
                                             <button type="button" onClick={handleAddColumn} className="text-[10px] font-bold bg-white text-gray-900 px-3 py-2 rounded-xl border border-gray-200 shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-all">+ Add Entry</button>
                                         </div>
                                         {configTableColumns.map((col, idx) => (
                                             <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex gap-4 items-start relative group">
                                                 <div className="flex-1 space-y-3">
                                                     <div>
                                                         <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Header</label>
                                                         <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:bg-white outline-none" value={col.header} onChange={e => handleUpdateColumn(idx, 'header', e.target.value)} />
                                                     </div>
                                                     <div>
                                                         <label className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block mb-1">Mapping</label>
                                                         {availablePaths.length > 0 ? (
                                                             <select className="w-full px-3 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs font-mono font-bold text-indigo-700 outline-none" value={col.bind} onChange={e => handleUpdateColumn(idx, 'bind', e.target.value)}>
                                                                 <option value="">-- Select Field --</option>
                                                                 {availablePaths.map(path => <option key={path} value={path}>{path}</option>)}
                                                             </select>
                                                         ) : (
                                                             <input type="text" placeholder="e.g. email" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono outline-none" value={col.bind} onChange={e => handleUpdateColumn(idx, 'bind', e.target.value)} />
                                                         )}
                                                     </div>
                                                 </div>
                                                 <button type="button" onClick={() => handleRemoveColumn(idx)} className="mt-5 text-gray-200 hover:text-rose-500 transition-colors">
                                                     <FiTrash2 size={16} />
                                                 </button>
                                             </div>
                                         ))}
                                     </div>
                                 )}

                                 {modalTab === 'style' && (
                                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                         <div className="grid grid-cols-2 gap-4">
                                              <div className="col-span-2">
                                                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">Theme Color</label>
                                                  <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                      <input type="color" className="w-10 h-10 rounded-xl border-0 cursor-pointer p-0 bg-transparent" value={configFormData.borderColor || '#4f46e5'} onChange={e => setConfigFormData({...configFormData, borderColor: e.target.value})} />
                                                      <input type="text" className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-indigo-600 focus:outline-none" value={configFormData.borderColor || '#4f46e5'} onChange={e => setConfigFormData({...configFormData, borderColor: e.target.value})} />
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Border</label>
                                                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white" value={configFormData.borderWidth || '1px'} onChange={e => setConfigFormData({...configFormData, borderWidth: e.target.value})}>
                                                      <option value="0px">None</option>
                                                      <option value="1px">Thin</option>
                                                      <option value="2px">Bold</option>
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Shadow</label>
                                                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white" value={configFormData.shadow || 'sm'} onChange={e => setConfigFormData({...configFormData, shadow: e.target.value})}>
                                                      <option value="none">Flat</option>
                                                      <option value="sm">Soft</option>
                                                      <option value="md">Std</option>
                                                      <option value="lg">High</option>
                                                  </select>
                                              </div>
                                         </div>
                                     </div>
                                 )}
                             </div>
                          )}

                          {configType === 'header' && (
                              <div className="space-y-5">
                                  {/* Tab Navigation for Header */}
                                  <div className="flex border-b border-gray-100 mb-4 sticky top-0 bg-white z-20 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                      {[
                                          { id: 'data', label: 'Data', icon: <FiSearch /> },
                                          { id: 'content', label: 'Content', icon: <FiLayout /> },
                                          { id: 'typography', label: 'Typography', icon: <FiType /> },
                                          { id: 'style', label: 'Styles', icon: <FiSettings /> }
                                      ].map(tab => (
                                          <button 
                                              key={tab.id}
                                              type="button"
                                              onClick={() => setModalTab(tab.id)}
                                              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 ${modalTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                          >
                                              {tab.icon}
                                              {tab.label}
                                          </button>
                                      ))}
                                  </div>

                                  {modalTab === 'data' && (
                                      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                          <div>
                                              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">API Data Linkage</label>
                                              <div className="flex gap-2">
                                                  <input type="text" placeholder="/api/v1/..." className="flex-1 font-mono text-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                                                      value={configFormData.dataSource || ''} onChange={e => setConfigFormData({...configFormData, dataSource: e.target.value})} />
                                                  <button type="button" onClick={discoverTableSchema} disabled={isFetchingSchema} className="px-5 py-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 flex items-center transition-all">
                                                      {isFetchingSchema ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <FiSearch className="mr-2" />}
                                                      Scan
                                                  </button>
                                              </div>
                                              <p className="mt-2 text-[10px] text-gray-400 italic">Scan to discover dynamic paths like {"{{name}}"} for your titles.</p>
                                          </div>
                                          {availablePaths.length > 0 && (
                                              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><FiCheck /></div>
                                                  <div className="text-xs text-emerald-800 font-bold uppercase tracking-tight">Handshake Successful: {availablePaths.length} Dynamic Paths Map Ready</div>
                                              </div>
                                          )}
                                      </div>
                                  )}

                                  {modalTab === 'content' && (
                                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                          <div className="space-y-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">Header Content Architecture</label>
                                              <div className="space-y-4">
                                                  <div>
                                                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Elite Title</label>
                                                      <input type="text" placeholder="Title (e.g. Welcome, {{name}})" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                                          value={configFormData.title || ''} onChange={e => setConfigFormData({...configFormData, title: e.target.value})} />
                                                  </div>
                                                  <div>
                                                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Subtext / Paragraph</label>
                                                      <textarea placeholder="Subtitle content..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] transition-all" 
                                                          value={configFormData.subtitle || ''} onChange={e => setConfigFormData({...configFormData, subtitle: e.target.value})} />
                                                  </div>
                                              </div>
                                          </div>

                                          {availablePaths.length > 0 && (
                                              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2 duration-400">
                                                  <label className="block text-[10px] uppercase font-bold text-indigo-600 tracking-widest mb-1">Discovered API Paths</label>
                                                  <p className="text-[10px] text-indigo-400 mb-3 font-medium">Click to synchronize and copy to clipboard.</p>
                                                  <div className="flex flex-wrap gap-2">
                                                      {availablePaths.map(path => (
                                                          <button 
                                                              key={path}
                                                              type="button" 
                                                              onClick={() => {
                                                                  navigator.clipboard.writeText(`{{${path}}}`);
                                                                  showAlert({ title: 'Metadata Linked', message: `{{${path}}} has been successfully buffered for insertion.`, type: 'success' });
                                                              }}
                                                              className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-[9px] font-mono font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 hover:border-indigo-400"
                                                          >
                                                              {path}
                                                          </button>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  )}

                                  {modalTab === 'typography' && (
                                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                          {/* Title Typography */}
                                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                              <label className="block text-[10px] uppercase font-bold text-indigo-600 tracking-widest mb-4">Main Title Typography</label>
                                              <div className="grid grid-cols-2 gap-4 mb-4">
                                                  <div>
                                                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Size (rem/px)</label>
                                                      <input type="text" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none" 
                                                          placeholder="2.25rem" value={configFormData.titleSize || ''} onChange={e => setConfigFormData({...configFormData, titleSize: e.target.value})} />
                                                  </div>
                                                  <div>
                                                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Weight</label>
                                                      <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                                          value={configFormData.titleWeight || '900'} onChange={e => setConfigFormData({...configFormData, titleWeight: e.target.value})}>
                                                          <option value="400">Regular</option>
                                                          <option value="600">Semi Bold</option>
                                                          <option value="700">Bold</option>
                                                          <option value="900">Black</option>
                                                      </select>
                                                  </div>
                                              </div>
                                              <div className="flex gap-2">
                                                  <button type="button" onClick={() => setConfigFormData({...configFormData, titleItalic: !configFormData.titleItalic})} 
                                                      className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.titleItalic ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Italic</button>
                                                  <button type="button" onClick={() => setConfigFormData({...configFormData, titleUnderline: !configFormData.titleUnderline})} 
                                                      className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.titleUnderline ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Underline</button>
                                              </div>
                                          </div>

                                          {/* Subtitle Typography */}
                                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                              <label className="block text-[10px] uppercase font-bold text-indigo-600 tracking-widest mb-4">Subtitle Typography</label>
                                              <div className="grid grid-cols-2 gap-4 mb-4">
                                                  <div>
                                                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Size</label>
                                                      <input type="text" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none" 
                                                          placeholder="1.1rem" value={configFormData.subtitleSize || ''} onChange={e => setConfigFormData({...configFormData, subtitleSize: e.target.value})} />
                                                  </div>
                                                  <div>
                                                      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Weight</label>
                                                      <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                                          value={configFormData.subtitleWeight || '500'} onChange={e => setConfigFormData({...configFormData, subtitleWeight: e.target.value})}>
                                                          <option value="300">Light</option>
                                                          <option value="400">Regular</option>
                                                          <option value="500">Medium</option>
                                                          <option value="600">Semi Bold</option>
                                                      </select>
                                                  </div>
                                              </div>
                                              <div className="flex gap-2">
                                                  <button type="button" onClick={() => setConfigFormData({...configFormData, subtitleItalic: !configFormData.subtitleItalic})} 
                                                      className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.subtitleItalic ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Italic</button>
                                                  <button type="button" onClick={() => setConfigFormData({...configFormData, subtitleUnderline: !configFormData.subtitleUnderline})} 
                                                      className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.subtitleUnderline ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Underline</button>
                                              </div>
                                          </div>
                                      </div>
                                  )}

                                  {modalTab === 'style' && (
                                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                          <div className="grid grid-cols-2 gap-4">
                                               <div className="col-span-2">
                                                   <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">Alignment</label>
                                                   <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                                       {['left', 'center', 'right'].map(align => (
                                                           <button 
                                                               key={align}
                                                               type="button"
                                                               onClick={() => setConfigFormData({...configFormData, alignment: align})}
                                                               className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${configFormData.alignment === align ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                           >
                                                               {align}
                                                           </button>
                                                       ))}
                                                   </div>
                                               </div>
                                               <div>
                                                   <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Background</label>
                                                   <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white" value={configFormData.backgroundType || 'solid'} onChange={e => setConfigFormData({...configFormData, backgroundType: e.target.value})}>
                                                       <option value="solid">Solid Color</option>
                                                       <option value="gradient">Brand Solid</option>
                                                       <option value="glass">Glassmorphism</option>
                                                   </select>
                                               </div>
                                               <div>
                                                   <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Shadow</label>
                                                   <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white" value={configFormData.shadow || 'none'} onChange={e => setConfigFormData({...configFormData, shadow: e.target.value})}>
                                                       <option value="none">Flat</option>
                                                       <option value="sm">Soft</option>
                                                       <option value="md">Std</option>
                                                       <option value="lg">High</option>
                                                   </select>
                                               </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                           )}

                           {configType === 'card' && (
                               <div className="space-y-5">
                                   {/* Tab Navigation for Card */}
                                   <div className="flex border-b border-gray-100 mb-4 sticky top-0 bg-white z-20 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                       {[
                                           { id: 'data', label: 'Data', icon: <FiSearch /> },
                                           { id: 'content', label: 'Content', icon: <FiLayout /> },
                                           { id: 'typography', label: 'Typography', icon: <FiType /> },
                                           { id: 'style', label: 'Styles', icon: <FiSettings /> }
                                       ].map(tab => (
                                           <button 
                                               key={tab.id}
                                               type="button"
                                               onClick={() => setModalTab(tab.id)}
                                               className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 ${modalTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                           >
                                               {tab.icon}
                                               {tab.label}
                                           </button>
                                       ))}
                                   </div>

                                   {modalTab === 'data' && (
                                       <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div>
                                               <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Independent Fetching</label>
                                               <div className="flex gap-2">
                                                   <input type="text" placeholder="/api/v1/..." className="flex-1 font-mono text-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white outline-none transition-all" 
                                                       value={configFormData.dataSource || ''} onChange={e => setConfigFormData({...configFormData, dataSource: e.target.value})} />
                                                   <button type="button" onClick={discoverTableSchema} disabled={isFetchingSchema} className="px-5 py-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                                                       Scan
                                                   </button>
                                               </div>
                                               <p className="mt-2 text-[10px] text-gray-400 italic font-medium">Leave blank to inherit data from the page context.</p>
                                           </div>
                                           {availablePaths.length > 0 && (
                                               <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                                   <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><FiCheck /></div>
                                                   <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest leading-none">Paths Synced: {availablePaths.length} Available</div>
                                               </div>
                                           )}
                                       </div>
                                   )}

                                    {modalTab === 'content' && (
                                       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {/* Header Section */}
                                            <div className="space-y-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest">Card Branding</label>
                                                <input type="text" placeholder="Card Title (e.g. My Profile)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                                                    value={configFormData.title || ''} onChange={e => setConfigFormData({...configFormData, title: e.target.value})} />
                                                <input type="text" placeholder="Subtitle (optional)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
                                                    value={configFormData.subtitle || ''} onChange={e => setConfigFormData({...configFormData, subtitle: e.target.value})} />
                                            </div>

                                            {availablePaths.length > 0 && (
                                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                                    <label className="block text-[10px] uppercase font-bold text-indigo-600 tracking-widest mb-2">Dynamic Data Assistant</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {availablePaths.map(path => (
                                                            <button 
                                                                key={path}
                                                                type="button" 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`{{${path}}}`);
                                                                    showAlert({ title: 'Path Copied', message: `{{${path}}} ready to paste.`, type: 'success' });
                                                                }}
                                                                className="px-2 py-1 bg-white border border-indigo-200 rounded-lg text-[9px] font-mono font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                            >
                                                                {path}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Fields Section */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center px-4">
                                                    <label className="text-[10px] uppercase font-bold text-indigo-600 tracking-widest leading-none">Dynamic Fields</label>
                                                    <button type="button" onClick={() => setConfigFormData({...configFormData, fields: [...(configFormData.fields || []), { label: 'New Field', bind: '' }]})} className="text-[10px] font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-all">+ Add Item</button>
                                                </div>
                                                <div className="space-y-3">
                                                    {(configFormData.fields || []).map((f, idx) => (
                                                        <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex gap-3 relative animate-in zoom-in-95 duration-200">
                                                            <div className="flex-1 space-y-2">
                                                                <input type="text" placeholder="Label" className="w-full text-[10px] font-bold uppercase text-gray-400 bg-transparent outline-none mb-1 border-b border-gray-50 focus:border-indigo-200 transition-colors" value={f.label} onChange={e => {
                                                                    const n = [...configFormData.fields]; n[idx].label = e.target.value; setConfigFormData({...configFormData, fields: n});
                                                                }} />
                                                                <select className="w-full text-xs font-mono font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 outline-none" value={f.bind} onChange={e => {
                                                                    const n = [...configFormData.fields]; n[idx].bind = e.target.value; setConfigFormData({...configFormData, fields: n});
                                                                }}>
                                                                    <option value="">-- Bind Variable --</option>
                                                                    {availablePaths.map(p => <option key={p} value={p}>{p}</option>)}
                                                                </select>
                                                            </div>
                                                            <button type="button" onClick={() => {
                                                                const n = configFormData.fields.filter((_, i) => i !== idx); setConfigFormData({...configFormData, fields: n});
                                                            }} className="text-gray-300 hover:text-rose-500 transition-colors self-center"><FiTrash2 /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                       </div>
                                   )}

                                   {modalTab === 'typography' && (
                                       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                               <label className="block text-[10px] uppercase font-bold text-indigo-600 tracking-widest mb-4">Title Appearance</label>
                                               <div className="grid grid-cols-2 gap-4 mb-4">
                                                   <div>
                                                       <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Color Palette</label>
                                                       <input type="color" className="w-full h-10 border-0 p-0 bg-transparent cursor-pointer rounded-xl" value={configFormData.titleColor || '#1e293b'} onChange={e => setConfigFormData({...configFormData, titleColor: e.target.value})} />
                                                   </div>
                                                   <div>
                                                       <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Text Size</label>
                                                       <input type="text" placeholder="1.25rem" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none" value={configFormData.titleSize || ''} onChange={e => setConfigFormData({...configFormData, titleSize: e.target.value})} />
                                                   </div>
                                               </div>
                                               <div className="flex gap-2">
                                                   <button type="button" onClick={() => setConfigFormData({...configFormData, titleItalic: !configFormData.titleItalic})} 
                                                       className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.titleItalic ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Italic</button>
                                                   <button type="button" onClick={() => setConfigFormData({...configFormData, titleUnderline: !configFormData.titleUnderline})} 
                                                       className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.titleUnderline ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Underline</button>
                                               </div>
                                           </div>

                                           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                               <label className="block text-[10px] uppercase font-bold text-indigo-600 tracking-widest mb-4">Subtitle Appearance</label>
                                               <div className="grid grid-cols-2 gap-4 mb-4">
                                                   <div>
                                                       <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Text Color</label>
                                                       <input type="color" className="w-full h-10 border-0 p-0 bg-transparent cursor-pointer rounded-xl" value={configFormData.subtitleColor || '#64748b'} onChange={e => setConfigFormData({...configFormData, subtitleColor: e.target.value})} />
                                                   </div>
                                                   <div>
                                                       <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Text Size</label>
                                                       <input type="text" placeholder="0.875rem" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none" value={configFormData.subtitleSize || ''} onChange={e => setConfigFormData({...configFormData, subtitleSize: e.target.value})} />
                                                   </div>
                                               </div>
                                               <div className="flex gap-2">
                                                   <button type="button" onClick={() => setConfigFormData({...configFormData, subtitleItalic: !configFormData.subtitleItalic})} 
                                                       className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.subtitleItalic ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Italic</button>
                                                   <button type="button" onClick={() => setConfigFormData({...configFormData, subtitleUnderline: !configFormData.subtitleUnderline})} 
                                                       className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all border ${configFormData.subtitleUnderline ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>Underline</button>
                                               </div>
                                           </div>
                                       </div>
                                   )}

                                   {modalTab === 'style' && (
                                       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                           <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                   <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3 leading-none">Layout Pattern</label>
                                                   <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                                       {[
                                                           { id: 'vertical', label: 'Stack' },
                                                           { id: 'grid-2', label: 'Grid x2' }
                                                       ].map(l => (
                                                           <button 
                                                               key={l.id}
                                                               type="button"
                                                               onClick={() => setConfigFormData({...configFormData, layout: l.id})}
                                                               className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${configFormData.layout === l.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                           >
                                                               {l.label}
                                                           </button>
                                                       ))}
                                                   </div>
                                                </div>
                                               <div>
                                                   <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Visual Mode</label>
                                                   <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white" value={configFormData.backgroundType || 'solid'} onChange={e => setConfigFormData({...configFormData, backgroundType: e.target.value})}>
                                                       <option value="solid">Sleek White</option>
                                                       <option value="gradient">Enterprise Solid</option>
                                                       <option value="glass">Glass Focus</option>
                                                   </select>
                                               </div>
                                               <div>
                                                   <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Shadow Level</label>
                                                   <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white" value={configFormData.shadow || 'md'} onChange={e => setConfigFormData({...configFormData, shadow: e.target.value})}>
                                                       <option value="none">Flat</option>
                                                       <option value="sm">Soft</option>
                                                       <option value="md">Std</option>
                                                       <option value="lg">Deep</option>
                                                       <option value="xl">Ultra</option>
                                                   </select>
                                               </div>
                                               <div className="col-span-2">
                                                   <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Side Accent Color</label>
                                                   <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                       <input type="color" className="w-10 h-10 rounded-xl border-0 cursor-pointer p-0 bg-transparent" value={configFormData.accentColor || '#6366f1'} onChange={e => setConfigFormData({...configFormData, accentColor: e.target.value})} />
                                                       <input type="text" placeholder="#hex" className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-indigo-600 focus:outline-none" value={configFormData.accentColor || ''} onChange={e => setConfigFormData({...configFormData, accentColor: e.target.value})} />
                                                   </div>
                                               </div>
                                           </div>
                                       </div>
                                   )}
                               </div>
                           )}

                           {configType === 'form' && (
                              <div className="space-y-5">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="col-span-2 md:col-span-1">
                                          <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">Form Title</label>
                                          <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white outline-none" 
                                              value={configFormData.title || ''} onChange={e => setConfigFormData({...configFormData, title: e.target.value})} />
                                      </div>
                                      <div className="col-span-2 md:col-span-1">
                                          <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">Submit Label</label>
                                          <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white outline-none" 
                                              value={configFormData.submitLabel || ''} onChange={e => setConfigFormData({...configFormData, submitLabel: e.target.value})} />
                                      </div>
                                      <div className="col-span-2">
                                          <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">API Endpoint</label>
                                          <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white outline-none font-mono text-sm" 
                                              value={configFormData.submitEndpoint || ''} onChange={e => setConfigFormData({...configFormData, submitEndpoint: e.target.value})} />
                                      </div>
                                  </div>
                                  
                                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                      <div className="flex justify-between items-center mb-4">
                                          <label className="text-[10px] uppercase font-bold text-gray-900 tracking-widest">Input Architect</label>
                                          <button type="button" onClick={handleAddField} className="text-[10px] font-bold bg-white text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm hover:scale-105 transition-all">+ Add Input</button>
                                      </div>
                                      <div className="space-y-3">
                                          {configFormFields.map(field => (
                                              <div key={field.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm relative group animate-in slide-in-from-right-4 duration-300">
                                                  <button type="button" onClick={() => handleRemoveField(field.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:scale-110 transition-all z-10">&times;</button>
                                                  <div className="grid grid-cols-2 gap-3">
                                                      <div>
                                                          <label className="text-[8px] uppercase font-bold text-gray-400 mb-1 block">ID Key</label>
                                                          <input type="text" required className="w-full font-mono text-[10px] px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white transition-all outline-none" value={field.name} onChange={e => updateField(field.id, 'name', e.target.value)} />
                                                      </div>
                                                      <div>
                                                          <label className="text-[8px] uppercase font-bold text-gray-400 mb-1 block">Label</label>
                                                          <input type="text" required className="w-full text-[10px] px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white transition-all outline-none" value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} />
                                                      </div>
                                                      <div className="col-span-2">
                                                          <select className="w-full text-[10px] px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none" value={field.type} onChange={e => updateField(field.id, 'type', e.target.value)}>
                                                              <option value="text">Text Input</option>
                                                              <option value="email">Email Address</option>
                                                              <option value="number">Numeric</option>
                                                              <option value="textarea">Multi-line Text</option>
                                                              <option value="date">Date Provider</option>
                                                          </select>
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* Global Container Styling */}
                          <div className="p-4 md:p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 mt-4">
                              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2"><FiLayout /> Container Layout</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Width Override</label>
                                      <input type="text" placeholder="Auto" className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-[11px] focus:ring-2 focus:ring-indigo-500 outline-none" 
                                          value={configFormData.width || ''} onChange={e => setConfigFormData({...configFormData, width: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Padding</label>
                                      <input type="text" placeholder="2rem" className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-[11px] focus:ring-2 focus:ring-indigo-500 outline-none" 
                                          value={configFormData.padding || ''} onChange={e => setConfigFormData({...configFormData, padding: e.target.value})} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Sticky Premium Footer */}
                      <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-gray-100 bg-white sticky bottom-0 -mx-6 px-6 z-30 mt-4 rounded-b-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                           <button type="button" onClick={() => setIsConfigModalOpen(false)} className="px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold text-gray-300 hover:text-gray-500 transition-all">Discard</button>
                           <button type="submit" className="px-6 md:px-10 py-2.5 md:py-3 text-[11px] md:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 md:gap-3">
                               <FiZap className="animate-pulse" />
                               Insert Block
                           </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
}

export default UIBuilder;

