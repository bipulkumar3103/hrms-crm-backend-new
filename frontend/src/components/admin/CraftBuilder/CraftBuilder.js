import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Toolbox } from './Toolbox';
import { SettingsPanel } from './SettingsPanel';
import { CraftHeader } from './user/CraftHeader';
import { CraftCard } from './user/CraftCard';
import { CraftTable } from './user/CraftTable';
import { CraftForm } from './user/CraftForm';
import { CraftButton } from './user/CraftButton';
import { CraftContainer } from './user/CraftContainer';
import { EliteSubmissions } from './EliteSubmissions';
import {
  FiSave, FiEye, FiZap, FiChevronRight, FiPlus,
  FiGlobe, FiDatabase, FiTrash2, FiMonitor,
  FiTablet, FiSmartphone, FiX, FiClock, FiBattery, FiWifi, FiSettings, FiActivity,
  FiMaximize, FiMinimize
} from 'react-icons/fi';
import { api } from '../../../utils/api';
import { useAlert } from '../../../context/AlertContext';
import { useAuth } from '../../../context/AuthContext';

/* Elite Serializer: Converts Craft Node Tree to Standard UI Schema (Recursive) */
const serializeToStandardSchema = (nodes) => {
  const serializeNode = (nodeId) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const componentName = node.data.type?.name || node.data.displayName || node.data.type?.resolvedName;
    let type = 'header';

    if (componentName?.includes('Header')) type = 'header';
    else if (componentName?.includes('Card')) type = 'card';
    else if (componentName?.includes('Table')) type = 'table';
    else if (componentName?.includes('Form')) type = 'form';
    else if (componentName?.includes('Button')) type = 'button';
    else if (componentName?.includes('Container')) type = 'container';

    const serialized = {
      id: nodeId,
      type: type,
      config: { ...node.data.props }
    };

    if (node.data.nodes && node.data.nodes.length > 0) {
      serialized.components = node.data.nodes
        .map(childId => serializeNode(childId))
        .filter(Boolean);
    }

    return serialized;
  };

  const rootNode = nodes['ROOT'];
  if (!rootNode) return { components: [] };

  const components = rootNode.data.nodes
    .map(nodeId => serializeNode(nodeId))
    .filter(Boolean);

  return { components };
};

/* Elite Deserializer: Converts Standard UI Schema to Craft Node Tree (Recursive) */
const deserializeFromStandardSchema = (schema) => {
  const nodes = {
    ROOT: {
      type: 'div',
      isCanvas: true,
      props: { className: "space-y-12 min-h-[500px]" },
      displayName: 'Canvas',
      custom: {},
      parent: null,
      hidden: false,
      nodes: [],
      linkedNodes: {}
    }
  };

  const deserializeComponent = (comp, parentId) => {
    const nodeId = comp.id || `node-${Math.random().toString(36).substr(2, 9)}`;

    let resolvedName = 'CraftHeader';
    if (comp.type === 'card') resolvedName = 'CraftCard';
    else if (comp.type === 'table') resolvedName = 'CraftTable';
    else if (comp.type === 'form') resolvedName = 'CraftForm';
    else if (comp.type === 'button') resolvedName = 'CraftButton';
    else if (comp.type === 'container') resolvedName = 'CraftContainer';

    nodes[nodeId] = {
      type: { resolvedName },
      isCanvas: ['CraftCard', 'CraftContainer'].includes(resolvedName),
      props: comp.config || {},
      displayName: resolvedName,
      custom: {},
      parent: parentId,
      hidden: false,
      nodes: [],
      linkedNodes: {}
    };

    if (comp.components && Array.isArray(comp.components)) {
      comp.components.forEach(childComp => {
        const childId = deserializeComponent(childComp, nodeId);
        nodes[nodeId].nodes.push(childId);
      });
    }

    return nodeId;
  };

  if (schema && Array.isArray(schema.components)) {
    schema.components.forEach(comp => {
      const nodeId = deserializeComponent(comp, 'ROOT');
      nodes.ROOT.nodes.push(nodeId);
    });
  }

  return JSON.stringify(nodes);
};

const CraftBuilderInternal = () => {
  const { token } = useAuth();
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  const { showAlert } = useAlert();

  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('/employee/dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Responsive / Preview / Mode States
  const [viewportWidth, setViewportWidth] = useState('100%');
  const [previewMode, setPreviewMode] = useState(false);
  const [activeMode, setActiveMode] = useState('architect'); // 'architect' | 'analysis'
  const [activeMobileSidebar, setActiveMobileSidebar] = useState(null); // 'toolbox' | 'settings' | null
  const [isFullScreen, setIsFullScreen] = useState(false);
  const builderRef = useRef(null);

  /* Full Screen Logic */
  const toggleFullScreen = useCallback(() => {
    if (!builderRef.current) return;

    if (!document.fullscreenElement) {
      builderRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  /* Persistence Logic */
  const fetchRoutes = useCallback(async () => {
    try {
      const res = await api.get('/ui/builder/layouts');
      const list = (res.data.routes || []).map(r => typeof r === 'string' ? { path: r, is_custom: false } : r);
      setRoutes(list);
    } catch (e) {
      console.error("Failed to fetch routes", e);
    }
  }, []);

  const lastLoadedRoute = useRef(null);

  const loadLayout = useCallback(async (route) => {
    if (!route || lastLoadedRoute.current === route) return;
    try {
      setIsLoading(true);
      lastLoadedRoute.current = route;
      const res = await api.get(`/ui/layout?route=${route}`);
      if (res.data && res.data.schema) {
        const craftState = deserializeFromStandardSchema(res.data.schema);
        actions.deserialize(craftState);
      } else {
        actions.deserialize(deserializeFromStandardSchema({ components: [] }));
      }
    } catch (e) {
      console.warn("No existing layout for this route, starting fresh.");
      actions.deserialize(deserializeFromStandardSchema({ components: [] }));
    } finally {
      setIsLoading(false);
    }
  }, [actions.deserialize]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    loadLayout(selectedRoute);
  }, [selectedRoute, loadLayout]);

  const handlePublish = async () => {
    try {
      setIsSaving(true);
      const nodes = query.getNodes();
      const standardSchema = serializeToStandardSchema(nodes);

      await api.post('/ui/builder/layout', {
        route: selectedRoute,
        schema: standardSchema
      });

      showAlert("Master Interface Published Locally Successfully!", "success");
      fetchRoutes();
    } catch (err) {
      showAlert("Deployment Handshake Failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const createNewRoute = async () => {
    const path = window.prompt("Enter new Enterprise Route path (e.g., /admin/v2/portal):");
    if (path) {
      if (!path.startsWith('/')) {
        showAlert("Registry Protocol Violation: All routes must begin with a leading slash (/)", "warning");
        return;
      }
      setSelectedRoute(path);
      setRoutes(prev => [...prev, { path, is_custom: true }]);
    }
  };

  const togglePreview = () => {
    const nextMode = !previewMode;
    setPreviewMode(nextMode);
    actions.setOptions((options) => (options.enabled = !nextMode));
    if (nextMode) {
      setViewportWidth('100%');
      setActiveMobileSidebar(null);
    }
  };

  const isDesktop = viewportWidth === '100%';

  return (
    <div
      ref={builderRef}
      className={`flex flex-col h-screen w-full bg-slate-50 relative overflow-hidden font-sans text-slate-900 ${isFullScreen ? 'bg-white' : ''}`}
    >
      {/* Elite Navigation Bar */}
      <header className="h-20 lg:h-24 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 lg:gap-4">
          {!previewMode && (
            <button
              onClick={() => setActiveMobileSidebar(activeMobileSidebar === 'toolbox' ? null : 'toolbox')}
              className="lg:hidden p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-colors"
            >
              <FiPlus className={`w-5 h-5 transition-transform ${activeMobileSidebar === 'toolbox' ? 'rotate-45' : ''}`} />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-[1rem] lg:rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-slate-200 bg-theme-secondary"
            >
              <FiZap className="w-5 h-5 lg:w-6 lg:h-6 text-theme-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[12px] lg:text-base font-semibold text-slate-900 leading-none mb-1">Elite Builder</h1>
              <p className="text-[9px] lg:text-[10px] font-semibold italic text-theme-primary">
                {activeMode === 'analysis' ? 'Intelligence' : previewMode ? 'Simulator' : 'Architect'}
              </p>
            </div>

            {/* Mode Switcher */}
            {!previewMode && (
              <div className="hidden lg:flex ml-4 bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
                <button
                  onClick={() => setActiveMode('architect')}
                  className={`px-6 py-2 text-[10px] font-semibold rounded-xl transition-all ${activeMode === 'architect' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Architect
                </button>
                <button
                  onClick={() => setActiveMode('analysis')}
                  className={`px-6 py-2 text-[10px] font-semibold rounded-xl transition-all ${activeMode === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Analysis
                </button>
              </div>
            )}
          </div>

          {activeMode === 'architect' && !previewMode && (
            <div className="hidden md:flex h-12 bg-slate-50 rounded-[1.25rem] border border-slate-100 items-center px-1.5 gap-1 shadow-inner">
              <div className="flex items-center gap-2 px-3 text-slate-400">
                <FiGlobe size={16} />
              </div>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="bg-transparent text-[11px] lg:text-[13px] font-semibold text-slate-800 focus:outline-none pr-8 py-2 min-w-[100px] lg:min-w-[160px] cursor-pointer appearance-none tracking-tight"
              >
                {routes.map(r => (
                  <option key={r.path} value={r.path}>{r.path}</option>
                ))}
              </select>
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              <button
                onClick={createNewRoute}
                title="Initialize New Route"
                className="p-2.5 bg-white hover:shadow-lg rounded-[1rem] transition-all hover:scale-105 text-theme-primary"
              >
                <FiPlus size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:gap-2">
          {previewMode && (
            <div className="hidden sm:flex items-center bg-slate-100/50 p-1 rounded-[1.5rem] border border-slate-100 shadow-sm mr-2">
              <button
                onClick={() => setViewportWidth('100%')}
                className={`p-2.5 rounded-2xl transition-all ${viewportWidth === '100%' ? 'bg-theme-primary text-white' : 'text-slate-400 bg-transparent'}`}
              >
                <FiMonitor size={16} />
              </button>
              <button
                onClick={() => setViewportWidth('768px')}
                className={`p-2.5 rounded-2xl transition-all ${viewportWidth === '768px' ? 'bg-theme-primary text-white' : 'text-slate-400 bg-transparent'}`}
              >
                <FiTablet size={16} />
              </button>
              <button
                onClick={() => setViewportWidth('375px')}
                className={`p-2.5 rounded-2xl transition-all ${viewportWidth === '375px' ? 'bg-theme-primary text-white' : 'text-slate-400 bg-transparent'}`}
              >
                <FiSmartphone size={16} />
              </button>
            </div>
          )}

          {!previewMode && activeMode === 'architect' && (
            <button
              onClick={toggleFullScreen}
              className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border transition-all shadow-sm ${isFullScreen ? 'bg-theme-primary text-white border-theme-primary' : 'bg-white text-slate-400 border-slate-100 hover:border-theme-primary/30'}`}
              title={isFullScreen ? "Exit Fullscreen" : "Elite Cinematic Mode"}
            >
              {isFullScreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
            </button>
          )}

          {activeMode === 'architect' && (
            <button
              onClick={togglePreview}
              className={`flex items-center gap-2 px-4 lg:px-8 py-2.5 lg:py-3.5 text-[10px] lg:text-[11px] font-semibold rounded-[1rem] lg:rounded-[1.25rem] border transition-all shadow-lg ${previewMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
            >
              {previewMode ? <FiX className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              <span className="hidden sm:inline">{previewMode ? 'End Preview' : 'Preview'}</span>
            </button>
          )}

          {activeMode === 'architect' && !previewMode && (
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 lg:px-10 py-2.5 lg:py-3.5 text-white text-[10px] lg:text-[11px] font-semibold rounded-[1rem] lg:rounded-[1.25rem] shadow-2xl transition-all disabled:opacity-50 bg-theme-primary"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <FiDatabase className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSaving ? 'Syncing...' : 'Deploy'}</span>
            </button>
          )}


          {!previewMode && activeMode === 'architect' && (
            <button
              onClick={() => setActiveMobileSidebar(activeMobileSidebar === 'settings' ? null : 'settings')}
              className="lg:hidden p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] transition-colors"
              title="Elite Configuration"
            >
              <FiSettings className={`w-5 h-5 transition-all ${activeMobileSidebar === 'settings' ? 'text-[var(--theme-primary)]' : ''}`} />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {activeMode === 'analysis' ? (
          <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-16 bg-slate-50/50">
            <EliteSubmissions />
          </main>
        ) : (
          <>
            {/* Architect View: Toolbox + Canvas + Settings */}
            <div className={`transition-all duration-500 ease-in-out fixed inset-0 z-40 lg:relative lg:inset-auto lg:block ${activeMobileSidebar === 'toolbox' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <div className="lg:hidden absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveMobileSidebar(null)}></div>
              <div className="relative h-full bg-white shadow-2xl lg:shadow-none w-[260px]">
                <Toolbox />
                {activeMobileSidebar === 'toolbox' && (
                  <button onClick={() => setActiveMobileSidebar(null)} className="lg:hidden absolute top-4 right-4 p-2 bg-gray-50 rounded-full"><FiX /></button>
                )}
              </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 bg-slate-100/30 flex justify-center custom-scrollbar scroll-smooth">
              <div style={{ width: viewportWidth }} className="transition-all duration-700 relative">
                <div className={`transition-all duration-700 ${!isDesktop ? 'border-[8px] lg:border-[16px] border-slate-900 rounded-[30px] lg:rounded-[60px] shadow-2xl bg-slate-900' : ''}`}>
                  {!isDesktop && (
                    <div className="h-6 lg:h-10 w-full flex items-center justify-between px-6 lg:px-10 text-white text-[8px] lg:text-[10px] font-medium">
                      <div className="flex items-center gap-2"><FiClock /> 12:45</div>
                      <div className="w-16 lg:w-24 h-4 lg:h-6 bg-slate-900 rounded-b-2xl absolute left-1/2 -translate-x-1/2 top-0"></div>
                      <div className="flex items-center gap-3"><FiWifi /><FiBattery className="rotate-90" /></div>
                    </div>
                  )}

                  <div className={`bg-white min-h-[75vh] p-4 lg:p-6 relative overflow-x-hidden ${!isDesktop ? 'rounded-[22px] lg:rounded-[44px] max-h-[80vh] lg:h-[800px] overflow-y-auto' : 'rounded-[32px] lg:rounded-[48px] shadow-2xl'}`}>
                    <Frame>
                      <Element is="div" className="space-y-12" canvas>
                        <CraftHeader title="Architecture Protocol" subtitle="Elite Builder Interface Ready." alignment="center" />
                      </Element>
                    </Frame>
                    {enabled && (
                      <div className="mt-20 lg:mt-40 flex flex-col items-center justify-center p-12 lg:p-24 border-4 border-dashed border-slate-50 rounded-[40px] opacity-30 hover:opacity-100 transition-all">
                        <FiDatabase className="text-slate-100 text-5xl lg:text-7xl mb-8" />
                        <h3 className="text-xs lg:text-sm font-semibold text-slate-300 uppercase tracking-[0.3em]">Drop Zone Ready</h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>

            <div className={`transition-all duration-500 ease-in-out fixed inset-0 z-40 lg:relative lg:inset-auto lg:block ${activeMobileSidebar === 'settings' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
              <div className="lg:hidden absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveMobileSidebar(null)}></div>
              <div className="relative h-full bg-white shadow-2xl lg:shadow-none ml-auto w-[300px]">
                <SettingsPanel />
                {activeMobileSidebar === 'settings' && (
                  <button onClick={() => setActiveMobileSidebar(null)} className="lg:hidden absolute top-4 left-4 p-2 bg-gray-50 rounded-full"><FiX /></button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

const CraftBuilder = () => {
  return (
    <Editor
      resolver={{
        CraftHeader,
        CraftCard,
        CraftTable,
        CraftForm,
        CraftButton,
        CraftContainer
      }}
    >
      <CraftBuilderInternal />
    </Editor>
  );
};

export default CraftBuilder;
