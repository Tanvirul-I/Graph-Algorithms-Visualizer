import React, { useCallback, useMemo, useRef, useState } from "react";
import { Graph } from "../models/Graph";
import { AlgorithmState } from "../algorithms/Algorithm";
import { Node } from "../models/Node";
import { Edge } from "../models/Edge";

interface GraphCanvasProps {
        graph: Graph;
        algorithmState: AlgorithmState;
        editMode?: boolean;
        selectedNodeId?: string | null;
        selectedEdgeId?: string | null;
        showWeights?: boolean;
        onCanvasClick?: (position: { x: number; y: number }) => void;
        onNodeClick?: (node: Node, event: React.MouseEvent<SVGCircleElement>) => void;
        onNodeDoubleClick?: (node: Node) => void;
        onEdgeClick?: (edge: Edge) => void;
        onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void;
        onNodeDelete?: (nodeId: string) => void;
}

const NODE_RADIUS = 14;

const GraphCanvas: React.FC<GraphCanvasProps> = ({
        graph,
        algorithmState,
        editMode = false,
        selectedNodeId = null,
        selectedEdgeId = null,
        showWeights = true,
        onCanvasClick,
        onNodeClick,
        onNodeDoubleClick,
        onEdgeClick,
        onNodePositionChange,
        onNodeDelete,
}) => {
        const svgRef = useRef<SVGSVGElement>(null);
        const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
        const [isDeleteZoneActive, setIsDeleteZoneActive] = useState<boolean>(false);
        const deleteZoneRef = useRef<HTMLDivElement>(null);
        const pointerStateRef = useRef<{
                mode: "idle" | "canvas" | "node";
                moved: boolean;
        }>({ mode: "idle", moved: false });
        const lastPointerInteractionRef = useRef<{
                mode: "idle" | "canvas" | "node";
                moved: boolean;
        }>({ mode: "idle", moved: false });
        const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);

        const highlightedNodeSet = useMemo(() => {
                return new Set(algorithmState.highlightedNodes);
        }, [algorithmState.highlightedNodes]);

        const highlightedEdgeSet = useMemo(() => {
                return new Set(algorithmState.highlightedEdges);
        }, [algorithmState.highlightedEdges]);

        const currentNodeSet = useMemo(() => {
                return new Set(algorithmState.currentNodes ?? []);
        }, [algorithmState.currentNodes]);

        const currentEdgeSet = useMemo(() => {
                return new Set(algorithmState.currentEdges ?? []);
        }, [algorithmState.currentEdges]);

        const getSvgPoint = useCallback(
                (clientX: number, clientY: number) => {
                        const svg = svgRef.current;
                        if (!svg) {
                                return { x: clientX, y: clientY };
                        }
                        const point = svg.createSVGPoint();
                        point.x = clientX;
                        point.y = clientY;
                        const transformedPoint = point.matrixTransform(
                                svg.getScreenCTM()?.inverse()
                        );
                        return { x: transformedPoint.x, y: transformedPoint.y };
                },
                []
        );

        const isPointerOverDeleteZone = useCallback((clientX: number, clientY: number) => {
                const rect = deleteZoneRef.current?.getBoundingClientRect();
                if (!rect) {
                        return false;
                }
                return (
                        clientX >= rect.left &&
                        clientX <= rect.right &&
                        clientY >= rect.top &&
                        clientY <= rect.bottom
                );
        }, []);

        const handleSvgClick = useCallback(
                (event: React.MouseEvent<SVGSVGElement>) => {
                        if (!editMode) {
                                return;
                        }
                        if (event.target !== event.currentTarget) {
                                return;
                        }
                        const { mode, moved } = lastPointerInteractionRef.current;
                        lastPointerInteractionRef.current = { mode: "idle", moved: false };
                        if (mode !== "canvas" || moved) {
                                return;
                        }
                        const position = getSvgPoint(event.clientX, event.clientY);
                        onCanvasClick?.(position);
                },
                [editMode, getSvgPoint, onCanvasClick]
        );

        const handleSvgPointerDown = useCallback(
                (event: React.PointerEvent<SVGSVGElement>) => {
                        if (!editMode) {
                                pointerStateRef.current = { mode: "idle", moved: false };
                                pointerDownPositionRef.current = null;
                                return;
                        }
                        if (event.target === event.currentTarget) {
                                pointerStateRef.current = { mode: "canvas", moved: false };
                                pointerDownPositionRef.current = {
                                        x: event.clientX,
                                        y: event.clientY,
                                };
                                event.currentTarget.setPointerCapture(event.pointerId);
                        } else {
                                pointerStateRef.current = { mode: "idle", moved: false };
                                pointerDownPositionRef.current = null;
                        }
                },
                [editMode]
        );

        const handleNodePointerDown = useCallback(
                (event: React.PointerEvent<SVGCircleElement>, node: Node) => {
                        if (!editMode) {
                                return;
                        }
                        event.stopPropagation();
                        pointerStateRef.current = { mode: "node", moved: false };
                        pointerDownPositionRef.current = {
                                x: event.clientX,
                                y: event.clientY,
                        };
                        setDraggingNodeId(node.id);
                },
                [editMode]
        );

        const handlePointerMove = useCallback(
                (event: React.PointerEvent<SVGSVGElement>) => {
                        if (!editMode) {
                                return;
                        }
                        if (pointerStateRef.current.mode !== "idle") {
                                const origin = pointerDownPositionRef.current;
                                if (origin) {
                                        const deltaX = event.clientX - origin.x;
                                        const deltaY = event.clientY - origin.y;
                                        if (!pointerStateRef.current.moved && Math.hypot(deltaX, deltaY) > 4) {
                                                pointerStateRef.current = {
                                                        ...pointerStateRef.current,
                                                        moved: true,
                                                };
                                        }
                                }
                        }
                        if (!draggingNodeId) {
                                if (isDeleteZoneActive) {
                                        setIsDeleteZoneActive(false);
                                }
                                return;
                        }
                        const position = getSvgPoint(event.clientX, event.clientY);
                        onNodePositionChange?.(draggingNodeId, position);
                        const overDeleteZone = isPointerOverDeleteZone(
                                event.clientX,
                                event.clientY
                        );
                        setIsDeleteZoneActive(overDeleteZone);
                },
                [
                        draggingNodeId,
                        editMode,
                        getSvgPoint,
                        isPointerOverDeleteZone,
                        isDeleteZoneActive,
                        onNodePositionChange,
                ]
        );

        const handlePointerUp = useCallback(
                (event: React.PointerEvent<SVGSVGElement>) => {
                        if (!editMode) {
                                pointerStateRef.current = { mode: "idle", moved: false };
                                lastPointerInteractionRef.current = { mode: "idle", moved: false };
                                pointerDownPositionRef.current = null;
                                return;
                        }
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                        }
                        if (pointerStateRef.current.mode !== "idle") {
                                lastPointerInteractionRef.current = { ...pointerStateRef.current };
                                pointerStateRef.current = { mode: "idle", moved: false };
                        } else {
                                lastPointerInteractionRef.current = { mode: "idle", moved: false };
                        }
                        pointerDownPositionRef.current = null;
                        if (draggingNodeId) {
                                const overDeleteZone = isPointerOverDeleteZone(
                                        event.clientX,
                                        event.clientY
                                );
                                if (overDeleteZone) {
                                        onNodeDelete?.(draggingNodeId);
                                }
                                setIsDeleteZoneActive(false);
                                setDraggingNodeId(null);
                        }
                },
                [draggingNodeId, editMode, isPointerOverDeleteZone, onNodeDelete]
        );

        const { viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = useMemo(() => {
                if (!graph.nodes.length) {
                        return {
                                viewBoxX: 0,
                                viewBoxY: 0,
                                viewBoxWidth: 800,
                                viewBoxHeight: 600,
                        };
                }

                const margin = NODE_RADIUS * 4;
                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;

                for (const node of graph.nodes) {
                        if (node.x < minX) {
                                minX = node.x;
                        }
                        if (node.y < minY) {
                                minY = node.y;
                        }
                        if (node.x > maxX) {
                                maxX = node.x;
                        }
                        if (node.y > maxY) {
                                maxY = node.y;
                        }
                }

                const width = maxX - minX || 0;
                const height = maxY - minY || 0;

                const paddedWidth = Math.max(width + margin * 2, 200);
                const paddedHeight = Math.max(height + margin * 2, 150);

                return {
                        viewBoxX: minX - margin,
                        viewBoxY: minY - margin,
                        viewBoxWidth: paddedWidth,
                        viewBoxHeight: paddedHeight,
                };
        }, [graph.nodes]);

        const renderEdges = () => {
                return graph.edges.map((edge) => {
                        const isHighlighted = highlightedEdgeSet.has(edge.id);
                        const isCurrent = currentEdgeSet.has(edge.id);
                        const isSelected = selectedEdgeId === edge.id;
                        const stroke = isSelected
                                ? "#ff9800"
                                : isCurrent
                                ? "#43a047"
                                : isHighlighted
                                ? "#f44336"
                                : "#999";
                        const strokeWidth = isCurrent ? 3 : 2;

                        const sourceX = edge.source.x;
                        const sourceY = edge.source.y;
                        const targetX = edge.target.x;
                        const targetY = edge.target.y;
                        const deltaX = targetX - sourceX;
                        const deltaY = targetY - sourceY;
                        const distance = Math.hypot(deltaX, deltaY);

                        let x1 = sourceX;
                        let y1 = sourceY;
                        let x2 = targetX;
                        let y2 = targetY;

                        if (distance > 0) {
                                const unitX = deltaX / distance;
                                const unitY = deltaY / distance;
                                const targetOffset = graph.directed ? NODE_RADIUS : 0;
                                x2 = targetX - unitX * targetOffset;
                                y2 = targetY - unitY * targetOffset;
                        }

                        const labelX = (x1 + x2) / 2;
                        const labelY = (y1 + y2) / 2;

                        return (
                                <g key={edge.id}>
                                        <line
                                                x1={x1}
                                                y1={y1}
                                                x2={x2}
                                                y2={y2}
                                                stroke={stroke}
                                                strokeWidth={strokeWidth}
                                                markerEnd={graph.directed ? "url(#arrowhead)" : undefined}
                                                onClick={(event) => {
                                                        if (!editMode) {
                                                                return;
                                                        }
                                                        event.stopPropagation();
                                                        onEdgeClick?.(edge);
                                                }}
                                                style={{ cursor: editMode ? "pointer" : "default" }}
                                        />
                                        {showWeights &&
                                                edge.weight !== undefined &&
                                                edge.weight !== null && (
                                                <text
                                                        x={labelX}
                                                        y={labelY}
                                                        fill="#000"
                                                        textAnchor="middle"
                                                        dy={-6}
                                                        stroke="#fff"
                                                        strokeWidth={0.75}
                                                        style={{
                                                                pointerEvents: "none",
                                                                fontWeight: 600,
                                                                paintOrder: "stroke",
                                                        }}
                                                >
                                                        {edge.weight}
                                                </text>
                                        )}
                                </g>
                        );
                });
        };

        const renderNodes = () => {
                return graph.nodes.map((node) => {
                        const isHighlighted = highlightedNodeSet.has(node.id);
                        const isCurrent = currentNodeSet.has(node.id);
                        const isSelected = selectedNodeId === node.id;
                        const fill = isSelected
                                ? "#ff9800"
                                : isCurrent
                                ? "#66bb6a"
                                : isHighlighted
                                ? "#ffcc80"
                                : "steelblue";

                        return (
                                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                                        <circle
                                                r={NODE_RADIUS}
                                                fill={fill}
                                                stroke="#fff"
                                                strokeWidth={2}
                                                onClick={(event) => {
                                                        event.stopPropagation();
                                                        onNodeClick?.(node, event);
                                                }}
                                                onDoubleClick={(event) => {
                                                        event.stopPropagation();
                                                        onNodeDoubleClick?.(node);
                                                }}
                                                onPointerDown={(event) => handleNodePointerDown(event, node)}
                                                style={{ cursor: editMode ? "grab" : "pointer" }}
                                        />
                                        <text
                                                x={0}
                                                y={5}
                                                textAnchor="middle"
                                                fill="#fff"
                                                style={{ pointerEvents: "none" }}
                                        >
                                                {node.label || node.id}
                                        </text>
                                </g>
                        );
                });
        };

        return (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <svg
                                ref={svgRef}
                                viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
                                width="100%"
                                height="100%"
                                preserveAspectRatio="xMidYMid meet"
                                onPointerDown={handleSvgPointerDown}
                                onClick={handleSvgClick}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                style={{
                                        border: "1px solid #ccc",
                                        backgroundColor: "#fafafa",
                                        cursor: editMode ? "crosshair" : "default",
                                }}
                        >
                                {graph.directed && (
                                        <defs>
                                                <marker
                                                        id="arrowhead"
                                                        markerWidth={12}
                                                        markerHeight={12}
                                                        refX={10}
                                                        refY={6}
                                                        orient="auto"
                                                        markerUnits="userSpaceOnUse"
                                                >
                                                        <path d="M0,0 L10,6 L0,12 z" fill="#000" />
                                                </marker>
                                        </defs>
                                )}
                                <g>{renderEdges()}</g>
                                <g>{renderNodes()}</g>
                        </svg>
                        {editMode && (
                                <div
                                        ref={deleteZoneRef}
                                        style={{
                                                position: "absolute",
                                                right: "16px",
                                                bottom: "16px",
                                                width: "64px",
                                                height: "64px",
                                                borderRadius: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: isDeleteZoneActive
                                                        ? "rgba(239, 68, 68, 0.18)"
                                                        : "rgba(100, 116, 139, 0.12)",
                                                border: isDeleteZoneActive
                                                        ? "2px solid #ef4444"
                                                        : "2px dashed #94a3b8",
                                                color: isDeleteZoneActive ? "#b91c1c" : "#475569",
                                                transition: "all 0.2s ease",
                                                pointerEvents: "none",
                                        }}
                                >
                                        <svg
                                                width="28"
                                                height="32"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                aria-hidden="true"
                                        >
                                                <path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V5h3.75a.75.75 0 0 1 0 1.5h-.666l-.69 12.423A2.75 2.75 0 0 1 14.651 21H9.35a2.75 2.75 0 0 1-2.743-2.077L5.918 6.5H5.25a.75.75 0 0 1 0-1.5H9zm4.5 1.5V3.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25V5zm-6.08 1.5.68 12.254a1.25 1.25 0 0 0 1.25 1.196h5.302a1.25 1.25 0 0 0 1.248-1.188L16.26 6.5zM10 9.75a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0zm3 0a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0z" />
                                        </svg>
                                </div>
                        )}
                </div>
        );
};

export default GraphCanvas;
