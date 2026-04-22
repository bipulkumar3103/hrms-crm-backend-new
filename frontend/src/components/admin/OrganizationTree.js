import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
    Background, Controls, MiniMap, useNodesState, useEdgesState,
    Handle, Position, MarkerType, ConnectionLineType,
    addEdge, getSmoothStepPath, EdgeLabelRenderer, ReactFlowProvider, useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { api } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLayers, FiSearch, FiMaximize2, FiCpu, FiAlertCircle, FiTrash2, FiX, FiTarget, FiMail, FiBriefcase, FiUser, FiPhone, FiMapPin, FiUsers, FiExternalLink } from 'react-icons/fi';
import PremiumLoader from '../PremiumLoader';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';

// --- Dagre Layout Configuration ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 260;
const nodeHeight = 110;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = Position.Top;
        node.sourcePosition = Position.Bottom;

        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

// --- Custom Edge with Delete Button ---
const CustomDeletableEdge = ({
    id, sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition, style = {}, markerEnd, selected, data
}) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });

    return (
        <>
            {/* Transparent wider path for easier clicking/selection */}
            <path
                id={`${id}-hit`}
                style={{ strokeWidth: 20, stroke: 'transparent', fill: 'none', cursor: 'pointer' }}
                className="react-flow__edge-interaction"
                d={edgePath}
                onClick={(e) => {
                    // This helps ensure selection triggers on the wider area
                }}
            />
            <path
                id={id}
                style={{ ...style, strokeWidth: selected ? 4 : 2.5, stroke: selected ? 'var(--theme-primary)' : '#CBD5E1' }}
                className="react-flow__edge-path transition-all duration-300"
                d={edgePath}
                markerEnd={markerEnd}
            />
            {selected && data?.canEdit && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                            zIndex: 1000
                        }}
                        className="nodrag nopan"
                    >
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onEdgeDelete(id);
                            }}
                            className="w-9 h-9 bg-red-500 text-white rounded-xl shadow-[0_8px_20px_rgba(239,68,68,0.3)] flex items-center justify-center hover:bg-red-600 border-2 border-white transition-all cursor-pointer"
                        >
                            <FiX size={18} strokeWidth={3} />
                        </motion.button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

// --- Custom Node Component ---
// --- Custom Node Component ---
const OrgChartNode = ({ data, selected }) => {
    const { employee, canEdit, type } = data;
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    // Non-employee structural nodes (Dept, Designation)
    if (type && type !== 'employee') {
        const getStyles = () => {
            switch (type) {
                case 'department': return { bg: 'bg-emerald-600', icon: <FiCpu /> };
                case 'designation': return { bg: 'bg-amber-500', icon: <FiTarget /> };
                default: return { bg: 'bg-[var(--theme-primary)]', icon: <FiLayers /> };
            }
        };
        const styles = getStyles();

        return (
            <div
                onClick={() => data.onToggleExpand && data.onToggleExpand(data.id)}
                className={`
                    relative w-[180px] h-14 rounded-2xl border transition-all cursor-pointer flex items-center justify-center
                    ${styles.bg} border-white/20
                    ${selected ? 'ring-4 ring-[var(--theme-primary)]/30 shadow-2xl scale-105' : 'hover:scale-102 shadow-lg'}
                `}
            >
                <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-white/40 !border-none !top-[-1px]" />

                {/* Unified Content Block: Flex-Integrated */}
                <div className="flex items-center justify-between w-full px-4 overflow-hidden gap-1">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="shrink-0 text-white/80">{styles.icon}</div>
                        <span className="text-[11px] font-bold text-white truncate uppercase tracking-tighter">{employee.name}</span>
                    </div>

                    {/* Structural Expansion Activator: INLINE ALIGNED */}
                    {employee.reports?.length > 0 && (
                        <motion.div
                            animate={{ rotate: data.isExpanded ? 180 : 0 }}
                            className="shrink-0 w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-white/40 transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </motion.div>
                    )}
                </div>

                <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-white/40 !border-none !bottom-[-1px]" />
            </div>
        );
    }

    // --- Rectangular Professional Employee Card ---
    return (
        <div className="relative flex flex-col items-center">
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !bg-[var(--theme-primary)] border-2 border-white shadow-sm transition-opacity ${(!canEdit || !selected) ? 'opacity-0' : 'opacity-100'}`}
            />

            <motion.div
                className={`
                    w-[240px] h-[84px] rounded-2xl bg-white border-2 flex items-center gap-4 p-3 transition-all relative
                    ${selected ? 'border-[var(--theme-primary)] ring-4 ring-[var(--theme-primary)]/10 shadow-2xl' : 'border-gray-100 shadow-md'}
                `}
            >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--theme-primary)]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                {/* Discovery Activator Icon: CLICK TRIGGER (CENTERED RIGHT) */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDetailsVisible(!isDetailsVisible);
                    }}
                    className={`
                        absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer z-20
                        ${isDetailsVisible ? 'bg-[var(--theme-primary)] text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:text-[var(--theme-primary)] hover:bg-white'}
                    `}
                >
                    {isDetailsVisible ? <FiX size={14} /> : <span className="text-sm font-black translate-x-[1px]">❯</span>}
                </div>

                {/* Left: Avatar Block */}
                <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 shadow-inner">
                        {employee.avatar ? (
                            <img src={employee.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-black text-[var(--theme-primary)] opacity-40 uppercase">{employee.name?.charAt(0)}</span>
                        )}
                    </div>
                    {/* Tiny Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${employee.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>

                {/* Right: Data Block */}
                <div className="flex-1 min-w-0 pr-1">
                    <h4 className="m-0 text-[15px] font-black text-slate-800 leading-none mb-1 truncate">
                        {employee.name}
                    </h4>
                    <p className="m-0 text-[9px] font-bold text-[var(--theme-primary)] uppercase tracking-wider truncate mb-1.5">
                        {employee.job_title}
                    </p>
                    <div className="flex items-center gap-1 opacity-60">
                        <FiLayers size={8} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 truncate">
                            {employee.department}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* ENTERPRISE ELITE DISCOVERY TOOLTIP: PERSISTENT UNTIL CLOSED */}
            <AnimatePresence>
                {isDetailsVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-full mb-6 z-[2000]" // Removed pointer-events-none so we can click X
                    >
                        {/* The High-Contrast Solid Glass Card */}
                        <div className="w-[300px] bg-white backdrop-blur-[40px] rounded-[36px] border border-white shadow-[0_40px_100px_rgba(0,0,0,0.25)] p-6 overflow-hidden relative pointer-events-auto">
                            {/* Animated Background Orbs */}
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[var(--theme-primary)]/10 rounded-full blur-[50px] animate-pulse" />

                            {/* Header Section: Compact with CLOSE ICON */}
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className={`w-2 h-2 rounded-full ${(employee.status?.toLowerCase() || '').includes('active') ? 'bg-emerald-500' :
                                                (employee.status?.toLowerCase() || '').includes('pending') ? 'bg-amber-500' :
                                                    'bg-slate-400'
                                            }`} />
                                        {(employee.status?.toLowerCase() || '').includes('active') && (
                                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" />
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-900/40">
                                        {(employee.status || 'Active').replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-2.5 py-1 bg-white/40 rounded-lg border border-white/50">
                                        <span className="text-[9px] font-mono text-[var(--theme-primary)] font-black tracking-tighter uppercase">ID-{String(employee.real_id || '00').padStart(4, '0')}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDetailsVisible(false);
                                        }}
                                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-slate-400 cursor-pointer"
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Profile Core: Dense */}
                            <div className="flex gap-4 items-center mb-6 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-white/60 p-1 shadow-xl border border-white/80 shrink-0">
                                    <div className="w-full h-full rounded-[14px] overflow-hidden flex items-center justify-center bg-slate-50">
                                        {employee.avatar ? (
                                            <img src={employee.avatar} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-xl font-black text-[var(--theme-primary)]">{employee.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="m-0 text-lg font-black text-slate-900 leading-tight truncate">{employee.name}</h4>
                                    <p className="m-0 text-[10px] font-extrabold text-[var(--theme-primary)]/70 uppercase tracking-widest truncate">{employee.job_title}</p>
                                </div>
                            </div>

                            {/* Precision Intelligence Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/30 relative z-10">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Division</span>
                                    <div className="flex items-center gap-1.5 text-slate-800">
                                        <FiLayers size={9} className="text-[var(--theme-primary)]" />
                                        <span className="text-[10px] font-bold truncate">{employee.department}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block opacity-70">Team</span>
                                    <div className="flex items-center gap-1.5 text-slate-800">
                                        <FiUsers size={9} className="text-[var(--theme-primary)]" />
                                        <span className="text-[10px] font-bold">{employee.team_size || '0'} Pax</span>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2 bg-white/10 p-2 rounded-xl border border-white/20">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <FiMail size={10} className="text-[var(--theme-primary)]" />
                                        <span className="text-[10px] font-bold truncate">{employee.email}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2 bg-white/10 p-2 rounded-xl border border-white/20">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <FiMapPin size={10} className="text-[var(--theme-primary)]" />
                                        <span className="text-[10px] font-bold truncate">{employee.location || 'Global Operations'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modern Action Strip */}
                            <div className="mt-6 flex gap-2 relative z-10 items-center">
                                <div className="flex-1 px-4 py-2 bg-[var(--theme-primary)] rounded-xl text-white text-[9px] font-black uppercase text-center cursor-pointer shadow-lg hover:bg-black transition-all">
                                    <p>View Analytics</p>
                                </div>
                                <div className="w-9 h-9 bg-white/60 rounded-xl flex items-center justify-center text-[var(--theme-primary)] border border-white/80 hover:bg-white transition-all cursor-pointer">
                                    <FiBriefcase size={12} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !bg-[var(--theme-primary)] border-2 border-white shadow-sm transition-opacity ${(!canEdit || !selected) ? 'opacity-0' : 'opacity-100'}`}
            />
        </div>
    );
};

const nodeTypes = { orgNode: OrgChartNode };
const edgeTypes = { deletableEdge: CustomDeletableEdge };

const OrganizationTreeContent = () => {
    const { isAdmin: canEdit } = useOutletContext();
    const { token } = useAuth();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('personnel');
    const [rawTreeData, setRawTreeData] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const { fitView } = useReactFlow();
    const { showAlert } = useAlert();

    const toggleNode = useCallback((nodeId) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    }, []);

    const fetchTree = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = viewMode === 'structure' ? '/organization/department-tree' : '/organization/tree';
            const res = await api.get(endpoint);
            setRawTreeData(res.data);
        } catch (err) {
            console.error("React Flow data error", err);
        } finally {
            setLoading(false);
        }
    }, [viewMode]);

    // Re-layout whenever data or expansion state changes
    useEffect(() => {
        if (!rawTreeData.length) return;

        const { initialNodes, initialEdges } = flattenTree(rawTreeData);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // Auto-center the view after layout with executive padding
        const triggerFitView = () => {
            const isMobile = window.innerWidth < 768;
            fitView({ 
                padding: isMobile ? 0.35 : 0.2, // Slightly more padding for a cleaner default look
                duration: 800, 
                maxZoom: 1
            });
        };

        // Fire multiple times to ensure we catch the final layout dimensions
        triggerFitView();
        const t1 = setTimeout(triggerFitView, 100);
        const t2 = setTimeout(triggerFitView, 300);
        
        setHasLoadedOnce(true);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [rawTreeData, expandedNodes, viewMode, canEdit, fitView]);

    const onEdgeDeleteAction = useCallback(async (edgeId) => {
        if (!canEdit) return;
        const edge = edges.find(e => e.id === edgeId);
        if (!edge) return;

        // Extract ID. Note: in structure mode IDs are composite strings.
        let targetId = edge.target.replace('node-', '');
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode?.data?.employee?.real_id) {
            targetId = targetNode.data.employee.real_id;
        }

        try {
            setLoading(true);
            await api.put(`/users/${targetId}`, { manager_id: null });
            showAlert('Reporting connection severed.', 'success');
            await fetchTree();
        } catch (err) {
            showAlert('Hierarchy update failed.', 'error');
        } finally {
            setLoading(false);
        }
    }, [canEdit, edges, nodes, fetchTree, showAlert]);

    const flattenTree = useCallback((roots) => {
        let initialNodes = [];
        let initialEdges = [];

        const traverse = (item, parentId = null) => {
            const nodeId = item.type ? item.id : `node-${item.id}`;
            const isEmployee = !item.type || item.type === 'employee';
            const type = item.type || 'employee';
            const isExpanded = expandedNodes.has(nodeId);

            initialNodes.push({
                id: nodeId,
                type: 'orgNode',
                data: {
                    id: nodeId,
                    employee: item,
                    canEdit: canEdit && isEmployee && viewMode === 'personnel',
                    type,
                    isExpanded,
                    onToggleExpand: (id) => toggleNode(id)
                },
                position: { x: 0, y: 0 }
            });

            if (parentId) {
                initialEdges.push({
                    id: `edge-${parentId}-${nodeId}`,
                    source: parentId,
                    target: nodeId,
                    type: 'deletableEdge',
                    data: {
                        canEdit: canEdit && isEmployee && viewMode === 'personnel',
                        onEdgeDelete: onEdgeDeleteAction
                    },
                    selectable: canEdit && isEmployee && viewMode === 'personnel',
                    deletable: canEdit && isEmployee && viewMode === 'personnel',
                    style: { stroke: '#CBD5E1', strokeWidth: 2.5 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#CBD5E1' }
                });
            }

            // Only traverse children if expanded (or if it's an employee node - though employees have no 'reports' in this view usually)
            if (item.reports && item.reports.length > 0) {
                if (isEmployee || isExpanded) {
                    item.reports.forEach(report => traverse(report, nodeId));
                }
            }
        };

        roots.forEach(root => traverse(root));
        return { initialNodes, initialEdges };
    }, [canEdit, onEdgeDeleteAction, viewMode, expandedNodes, toggleNode]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const onConnect = useCallback(async (params) => {
        if (!canEdit) return;

        let sourceId = params.source.replace('node-', '');
        let targetId = params.target.replace('node-', '');

        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);

        if (sourceNode?.data?.employee?.real_id) sourceId = sourceNode.data.employee.real_id;
        if (targetNode?.data?.employee?.real_id) targetId = targetNode.data.employee.real_id;

        if (sourceId === targetId) return showAlert('Self-assignment blocked.', 'warning');

        try {
            setLoading(true);
            await api.put(`/users/${targetId}`, { manager_id: parseInt(sourceId) });
            showAlert('Corporate hierarchy updated.', 'success');
            await fetchTree();
        } catch (err) {
            showAlert('Structural update failed.', 'error');
        } finally {
            setLoading(false);
        }
    }, [canEdit, fetchTree, showAlert]);

    if (loading) return <PremiumLoader message="Recalculating Matrix..." />;

    return (
        <div className="nx-ts-animate w-full flex-1 flex flex-col min-h-0" style={{ height: 'calc(100dvh - 220px)', minHeight: '400px' }}>
            <div className="mb-4 sm:mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 px-1 sm:px-2">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center text-[var(--theme-primary)] shrink-0 border border-[var(--theme-primary)]/10"
                      style={{ boxShadow: 'var(--theme-primary-glow)' }}
                    >
                        <FiLayers size={24} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1 truncate">
                            Personnel Matrix Flow
                        </h1>
                        <p className="text-gray-400 font-semibold uppercase text-[7px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap overflow-hidden text-ellipsis">Organizational Hierarchy & Structural Governance</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm self-start lg:self-auto">
                    <FiCpu className="text-[var(--theme-primary)] animate-spin-slow shrink-0" />
                    <span className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        <span className="hidden sm:inline">{canEdit ? 'Administrative Mode' : 'Read-Only View'}</span>
                        <span className="sm:hidden">{canEdit ? 'Admin' : 'ReadOnly'}</span>
                    </span>
                </div>
            </div>

            <div className="flex-1 rounded-[40px] border border-dashed border-gray-200 overflow-hidden bg-gray-50/20 relative shadow-inner group">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    fitView
                    fitViewOptions={{ padding: window.innerWidth < 768 ? 0.35 : 0.2 }}
                    minZoom={0.1}
                    maxZoom={4}
                >
                    <Background color="#E2E8F0" gap={40} size={1} />
                    <Controls className="!bg-white !shadow-2xl !border-none !rounded-2xl" />
                    {/* <MiniMap maskColor="rgba(255, 255, 255, 0.7)" className="!bg-white/40 !backdrop-blur-md !rounded-[24px] hidden sm:block" style={{ height: 120 }} zoomable pannable /> */}
                </ReactFlow>

                {/* Unified Responsive Navigation Cluster */}
                <div className="absolute top-4 right-4 sm:top-8 sm:right-12 z-[100] flex flex-col items-end gap-3 pointer-events-none">
                    {/* Personnel/Structure Mode Toggle */}
                    <div className="bg-white/90 backdrop-blur-xl px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-2xl shadow-xl border border-white flex items-center gap-1 pointer-events-auto">
                        <button
                            onClick={() => setViewMode('personnel')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'personnel' ? 'bg-[var(--theme-primary)] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Personnel
                        </button>
                        <button
                            onClick={() => setViewMode('structure')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'structure' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Structure
                        </button>
                    </div>

                    {/* Matrix Sync & Navigation Badge */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/95 backdrop-blur-3xl rounded-2xl border border-white p-2 sm:p-3 shadow-[0_20px_60px_rgba(0,0,0,0.12)] flex items-center gap-2 sm:gap-3 transition-all group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.2)] pointer-events-auto"
                    >
                        <div
                            onClick={() => {
                                fitView({ padding: window.innerWidth < 768 ? 0.35 : 0.2, duration: 800 });
                            }}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center cursor-pointer hover:bg-emerald-600 hover:text-white transition-all shadow-inner"
                        >
                            <FiMaximize2 size={14} />
                        </div>
                        <div className="flex-1 pr-1 sm:pr-2">
                            <h4 className="m-0 text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Matrix Sync</h4>
                            <p className="m-0 text-[10px] sm:text-[12px] font-black text-slate-900 leading-none truncate max-w-[100px] sm:max-w-none">
                                {viewMode === 'personnel' ? 'Live Hierarchy' : 'Organizational Flow'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .react-flow__handle { width: 12px; height: 12px; background: var(--theme-primary); }
                .react-flow__controls-button { border-bottom: 1px solid #f1f5f9; background: #fff; fill: var(--theme-primary); }
            `}</style>
        </div>
    );
};

const OrganizationTree = () => (
    <ReactFlowProvider>
        <OrganizationTreeContent />
    </ReactFlowProvider>
);

export default OrganizationTree;
