import React, { useCallback, useEffect, useMemo, useState } from "react";
import GraphCanvas from "./components/GraphCanvas";
import Controls from "./components/Controls";
import AlgorithmSelector from "./components/AlgorithmSelector";
import AlgorithmStepInfo from "./components/AlgorithmStepInfo";
import Modal from "./components/Modal";
import AccordionSection from "./components/AccordionSection";
import { Graph, SerializedGraph } from "./models/Graph";
import {
        Algorithm,
        AlgorithmState,
        AlgorithmStepRecord,
} from "./algorithms/Algorithm";
import { DijkstraAlgorithm } from "./algorithms/DijkstraAlgorithm";
import { BFSAlgorithm } from "./algorithms/BFSAlgorithm";
import { DFSAlgorithm } from "./algorithms/DFSAlgorithm";
import { AStarAlgorithm } from "./algorithms/AStarAlgorithm";
import { KruskalAlgorithm } from "./algorithms/KruskalAlgorithm";
import { PrimAlgorithm } from "./algorithms/PrimAlgorithm";
import { ConvexHullAlgorithm } from "./algorithms/ConvexHullAlgorithm";
import { ClosestPairAlgorithm } from "./algorithms/ClosestPairAlgorithm";
import { FarthestPairAlgorithm } from "./algorithms/FarthestPairAlgorithm";
import { Node } from "./models/Node";
import { Edge } from "./models/Edge";

const STORAGE_KEY = "graph-visualizer-saved-graphs";

interface StoredGraph {
        name: string;
        data: SerializedGraph;
}

type ModalState =
        | {
                        type: "message";
                        title: string;
                        message: string;
                        onConfirm?: () => void;
                }
        | {
                        type: "edge-weight";
                        title: string;
                        sourceId: string;
                        targetId: string;
                }
        | {
                        type: "create-graph";
                        title: string;
                }
        | {
                        type: "node-label";
                        title: string;
                        nodeId: string;
                };

const createSampleGraph = () => {
        const nodes: Node[] = [
                { id: "A", label: "A", x: 120, y: 120 },
                { id: "B", label: "B", x: 320, y: 120 },
                { id: "C", label: "C", x: 220, y: 320 },
                { id: "D", label: "D", x: 520, y: 180 },
                { id: "E", label: "E", x: 360, y: 460 },
                { id: "F", label: "F", x: 260, y: 620 },
        ];
        const nodeMap = new Map(nodes.map((node) => [node.id, node]));
        const edges: Edge[] = [
                {
                        id: "AB",
                        source: nodeMap.get("A")!,
                        target: nodeMap.get("B")!,
                        weight: 1,
                },
                {
                        id: "AC",
                        source: nodeMap.get("A")!,
                        target: nodeMap.get("C")!,
                        weight: 4,
                },
                {
                        id: "DC",
                        source: nodeMap.get("D")!,
                        target: nodeMap.get("C")!,
                        weight: 2,
                },
                {
                        id: "EF",
                        source: nodeMap.get("E")!,
                        target: nodeMap.get("F")!,
                        weight: 3,
                },
                {
                        id: "AF",
                        source: nodeMap.get("A")!,
                        target: nodeMap.get("F")!,
                        weight: 9,
                },
                {
                        id: "BF",
                        source: nodeMap.get("B")!,
                        target: nodeMap.get("F")!,
                        weight: 5,
                },
                {
                        id: "DE",
                        source: nodeMap.get("D")!,
                        target: nodeMap.get("E")!,
                        weight: 8,
                },
        ];
        return new Graph(nodes, edges, true);
};

const rebuildGraph = (nodes: Node[], edges: Edge[], directed: boolean) => {
        const nextNodes = nodes.map((node) => ({ ...node }));
        const nodeMap = new Map(nextNodes.map((node) => [node.id, node]));
        const nextEdges = edges.map((edge) => {
                const source = nodeMap.get(edge.source.id);
                const target = nodeMap.get(edge.target.id);
                if (!source || !target) {
                        throw new Error("Failed to rebuild graph due to missing node references.");
                }
                return {
                        ...edge,
                        source,
                        target,
                };
        });
        return new Graph(nextNodes, nextEdges, directed);
};

const generateNodeId = (nodes: Node[]): string => {
        let counter = 1;
        while (nodes.some((node) => node.id === `N${counter}`)) {
                counter += 1;
        }
        return `N${counter}`;
};

const generateEdgeId = (sourceId: string, targetId: string) => {
        return `E_${sourceId}_${targetId}_${Math.random().toString(36).slice(2, 8)}`;
};

const createEmptyAlgorithmState = (): AlgorithmState => ({
        highlightedNodes: [],
        highlightedEdges: [],
        currentNodes: [],
        currentEdges: [],
        nodeValues: {},
});

const cloneAlgorithmState = (state: AlgorithmState): AlgorithmState => ({
        highlightedNodes: [...state.highlightedNodes],
        highlightedEdges: [...state.highlightedEdges],
        currentNodes: [...state.currentNodes],
        currentEdges: [...state.currentEdges],
        nodeValues: { ...state.nodeValues },
});

const loadSavedGraphs = (): StoredGraph[] => {
        if (typeof window === "undefined") {
                return [];
        }
        try {
                const stored = window.localStorage.getItem(STORAGE_KEY);
                if (!stored) {
                        return [];
                }
                const parsed = JSON.parse(stored) as StoredGraph[];
                return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
                console.error("Failed to load graphs from local storage", error);
                return [];
        }
};

const saveGraphsToStorage = (graphs: StoredGraph[]) => {
        if (typeof window === "undefined") {
                return;
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(graphs));
};

const App: React.FC = () => {
        const [graph, setGraph] = useState<Graph>(() => createSampleGraph());
        const [graphType, setGraphType] = useState<"directed" | "undirected">(
                "directed"
        );
        const [graphWeightType, setGraphWeightType] = useState<
                "weighted" | "unweighted"
        >("weighted");
        const [editMode, setEditMode] = useState<boolean>(false);
        const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
        const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
        const [savedGraphs, setSavedGraphs] = useState<StoredGraph[]>([]);
        const [currentGraphName, setCurrentGraphName] = useState<string>("Sample Graph");
        const [selectedSavedGraph, setSelectedSavedGraph] = useState<string>("");
        const [algorithmInstance, setAlgorithmInstance] = useState<Algorithm | null>(
                null
        );
        const [algorithmState, setAlgorithmState] = useState<AlgorithmState>({
                highlightedNodes: [],
                highlightedEdges: [],
                currentNodes: [],
                currentEdges: [],
                nodeValues: {},
        });
        const [algorithmSteps, setAlgorithmSteps] = useState<AlgorithmStepRecord[]>([]);
        const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
        const [algorithmComplete, setAlgorithmComplete] = useState<boolean>(false);
        const [graphSectionOpen, setGraphSectionOpen] = useState<boolean>(true);
        const [algorithmSectionOpen, setAlgorithmSectionOpen] = useState<boolean>(true);
        const [edgeEditor, setEdgeEditor] = useState<{
                sourceId: string;
                targetId: string;
                weight: string;
        }>({
                sourceId: "",
                targetId: "",
                weight: "",
        });
        const [edgeWeightDefault, setEdgeWeightDefault] = useState<string>("");
        const [edgeWeightInput, setEdgeWeightInput] = useState<string>("");
        const [edgeWeightError, setEdgeWeightError] = useState<string>("");
        const [modalState, setModalState] = useState<ModalState | null>(null);
        const [graphCreationForm, setGraphCreationForm] = useState<{
                name: string;
                directed: "directed" | "undirected";
                weightType: "weighted" | "unweighted";
        }>({
                name: "My Graph",
                directed: "directed",
                weightType: "weighted",
        });
        const [graphCreationError, setGraphCreationError] = useState<string>("");
        const [nodeLabelInput, setNodeLabelInput] = useState<string>("");

        const algorithms = useMemo<{ [key: string]: Algorithm }>(() => {
                return {
                        Dijkstra: new DijkstraAlgorithm(),
                        BFS: new BFSAlgorithm(),
                        DFS: new DFSAlgorithm(),
                        AStar: new AStarAlgorithm(),
                        Kruskal: new KruskalAlgorithm(),
                        Prim: new PrimAlgorithm(),
                        ConvexHull: new ConvexHullAlgorithm(),
                        ClosestPair: new ClosestPairAlgorithm(),
                        FarthestPair: new FarthestPairAlgorithm(),
                };
        }, []);

        const initializeAlgorithmInstance = useCallback(
                (algorithm: Algorithm) => {
                        algorithm.initialize(graph);
                        const liveState = cloneAlgorithmState(algorithm.getState());
                        const info = algorithm.getStepInfo();
                        const description =
                                info && info.trim().length > 0
                                        ? info
                                        : "Algorithm initialized.";
                        const initialRecord: AlgorithmStepRecord = {
                                state: cloneAlgorithmState(liveState),
                                description,
                        };
                        setAlgorithmState(liveState);
                        setAlgorithmSteps([initialRecord]);
                        setCurrentStepIndex(0);
                        setAlgorithmComplete(false);
                },
                [graph]
        );

        const closeModal = () => {
                setModalState(null);
                setEdgeWeightError("");
                setEdgeWeightInput("");
                setNodeLabelInput("");
                setGraphCreationError("");
        };

        const showMessageModal = (
                title: string,
                message: string,
                onConfirm?: () => void
        ) => {
                setModalState({ type: "message", title, message, onConfirm });
        };

        useEffect(() => {
                setSavedGraphs(loadSavedGraphs());
        }, []);

        useEffect(() => {
                setGraphType(graph.directed ? "directed" : "undirected");
                setGraphCreationForm((previous) => ({
                        ...previous,
                        directed: graph.directed ? "directed" : "undirected",
                }));
        }, [graph.directed]);

        useEffect(() => {
                if (!editMode && selectedEdgeId) {
                        setSelectedEdgeId(null);
                }
        }, [editMode, selectedEdgeId]);

        useEffect(() => {
                if (!selectedEdgeId) {
                        return;
                }
                const edge = graph.edges.find((candidate) => candidate.id === selectedEdgeId);
                if (!edge) {
                        setEdgeEditor({
                                sourceId: "",
                                targetId: "",
                                weight: "",
                        });
                        return;
                }
                const storedWeight =
                        edge.weight !== undefined && edge.weight !== null
                                ? String(edge.weight)
                                : "";
                setEdgeEditor({
                        sourceId: edge.source.id,
                        targetId: edge.target.id,
                        weight: graphWeightType === "unweighted" ? "" : storedWeight,
                });
        }, [graph.edges, selectedEdgeId, graphWeightType]);

        useEffect(() => {
                if (!algorithmInstance) {
                        setAlgorithmState(createEmptyAlgorithmState());
                        setAlgorithmSteps([]);
                        setCurrentStepIndex(0);
                        setAlgorithmComplete(false);
                        return;
                }
                initializeAlgorithmInstance(algorithmInstance);
        }, [algorithmInstance, initializeAlgorithmInstance]);

        const handleSelectAlgorithm = (name: string) => {
                if (!name) {
                        setAlgorithmInstance(null);
                        setAlgorithmState(createEmptyAlgorithmState());
                        setAlgorithmSteps([]);
                        setCurrentStepIndex(0);
                        setAlgorithmComplete(false);
                        return;
                }
                const algorithm = algorithms[name];
                if (algorithm) {
                        setAlgorithmState(createEmptyAlgorithmState());
                        setAlgorithmSteps([]);
                        setCurrentStepIndex(0);
                        setAlgorithmComplete(false);
                        setAlgorithmInstance(algorithm);
                        setAlgorithmSectionOpen(true);
                }
        };

        const applyStep = useCallback(
                (index: number) => {
                        const step = algorithmSteps[index];
                        if (!step) {
                                return;
                        }
                        setCurrentStepIndex(index);
                        setAlgorithmState(cloneAlgorithmState(step.state));
                },
                [algorithmSteps]
        );

        const handleNextStep = () => {
                if (!algorithmInstance) {
                        return;
                }
                if (currentStepIndex < algorithmSteps.length - 1) {
                        applyStep(currentStepIndex + 1);
                        return;
                }
                if (algorithmComplete) {
                        return;
                }
                const hasMoreSteps = algorithmInstance.step();
                const liveState = cloneAlgorithmState(algorithmInstance.getState());
                const info = algorithmInstance.getStepInfo();
                const description =
                        info && info.trim().length > 0
                                ? info
                                : `Step ${algorithmSteps.length + 1}.`;
                const snapshot = cloneAlgorithmState(liveState);
                setAlgorithmState(liveState);
                setAlgorithmSteps((previous) => {
                        const nextSteps = [...previous, { state: snapshot, description }];
                        setCurrentStepIndex(nextSteps.length - 1);
                        return nextSteps;
                });
                if (!hasMoreSteps) {
                        setAlgorithmComplete(true);
                        showMessageModal(
                                "Algorithm Complete",
                                "Algorithm has finished executing."
                        );
                }
        };

        const handlePreviousStep = () => {
                if (currentStepIndex > 0) {
                        applyStep(currentStepIndex - 1);
                }
        };

        const handleFirstStep = () => {
                if (algorithmSteps.length > 0) {
                        applyStep(0);
                }
        };

        const handleLastStep = () => {
                if (algorithmSteps.length > 0) {
                        applyStep(algorithmSteps.length - 1);
                }
        };

        const handleStepChange = (stepIndex: number) => {
                if (stepIndex >= 0 && stepIndex < algorithmSteps.length) {
                        applyStep(stepIndex);
                }
        };

        const handleReset = () => {
                if (algorithmInstance) {
                        initializeAlgorithmInstance(algorithmInstance);
                }
        };

        const handleGraphTypeChange = (
                event: React.ChangeEvent<HTMLSelectElement>
        ) => {
                const nextType = event.target.value as "directed" | "undirected";
                setGraphType(nextType);
                setGraph((previous) => previous.clone({ directed: nextType === "directed" }));
                setGraphCreationForm((previous) => ({
                        ...previous,
                        directed: nextType,
                }));
        };

        const handleGraphWeightTypeChange = (
                event: React.ChangeEvent<HTMLSelectElement>
        ) => {
                const nextType = event.target.value as "weighted" | "unweighted";
                if (graphWeightType === "unweighted" && nextType === "weighted") {
                        setEdgeWeightDefault("0");
                }
                setGraphWeightType(nextType);
                setGraphCreationForm((previous) => ({
                        ...previous,
                        weightType: nextType,
                }));
        };

        const handleCanvasClick = (position: { x: number; y: number }) => {
                let createdNodeId = "";
                setGraph((previous) => {
                        const id = generateNodeId(previous.nodes);
                        createdNodeId = id;
                        const newNode: Node = {
                                id,
                                label: id,
                                x: position.x,
                                y: position.y,
                        };
                        const nodes = [...previous.nodes, newNode];
                        const edges = previous.edges.map((edge) => ({ ...edge }));
                        return rebuildGraph(nodes, edges, previous.directed);
                });
                setSelectedNodeId(createdNodeId);
                setSelectedEdgeId(null);
        };

        const handleNodePositionChange = (
                nodeId: string,
                position: { x: number; y: number }
        ) => {
                setGraph((previous) => {
                        const nodes = previous.nodes.map((node) =>
                                node.id === nodeId
                                        ? { ...node, x: position.x, y: position.y }
                                        : { ...node }
                        );
                        const edges = previous.edges.map((edge) => ({ ...edge }));
                        return rebuildGraph(nodes, edges, previous.directed);
                });
        };

        const handleNodeDelete = (nodeId: string) => {
                setGraph((previous) => {
                        const nodes = previous.nodes
                                .filter((node) => node.id !== nodeId)
                                .map((node) => ({ ...node }));
                        const edges = previous.edges
                                .filter(
                                        (edge) =>
                                                edge.source.id !== nodeId &&
                                                edge.target.id !== nodeId
                                )
                                .map((edge) => ({ ...edge }));
                        return rebuildGraph(nodes, edges, previous.directed);
                });
                setSelectedNodeId((previous) => (previous === nodeId ? null : previous));
                setSelectedEdgeId((previous) => {
                        if (!previous) {
                                return null;
                        }
                        const connectedEdge = graph.edges.find(
                                (edge) =>
                                        edge.id === previous &&
                                        (edge.source.id === nodeId || edge.target.id === nodeId)
                        );
                        return connectedEdge ? null : previous;
                });
        };

        const finalizeEdgeCreation = (
                sourceId: string,
                targetId: string,
                weightValue: number | undefined
        ) => {
                setGraph((previous) => {
                        const sourceNode = previous.getNodeById(sourceId);
                        const targetNode = previous.getNodeById(targetId);
                        if (!sourceNode || !targetNode) {
                                return previous;
                        }
                        if (
                                previous.edges.some(
                                        (edge) =>
                                                edge.source.id === sourceId &&
                                                edge.target.id === targetId
                                )
                        ) {
                                return previous;
                        }
                        const nodes = previous.nodes.map((node) => ({ ...node }));
                        const edges = previous.edges.map((edge) => ({ ...edge }));
                        const newEdge: Edge = {
                                id: generateEdgeId(sourceId, targetId),
                                source: sourceNode,
                                target: targetNode,
                                weight: weightValue,
                        };
                        edges.push(newEdge);
                        return rebuildGraph(nodes, edges, previous.directed);
                });
                setSelectedNodeId(null);
        };

        const createEdgeBetweenNodes = (sourceId: string, targetId: string) => {
                if (sourceId === targetId) {
                        setSelectedNodeId(null);
                        return;
                }
                const existingEdge = graph.edges.find(
                        (edge) =>
                                edge.source.id === sourceId &&
                                edge.target.id === targetId
                );
                if (existingEdge) {
                        showMessageModal(
                                "Edge Already Exists",
                                "An edge between these nodes already exists."
                        );
                        setSelectedNodeId(null);
                        return;
                }

                if (graphWeightType === "unweighted") {
                        finalizeEdgeCreation(sourceId, targetId, 0);
                        return;
                }

                setEdgeWeightInput(edgeWeightDefault);
                setEdgeWeightError("");
                setModalState({
                        type: "edge-weight",
                        title: "Set Edge Weight",
                        sourceId,
                        targetId,
                });
        };

        const handleEdgeWeightInputChange = (
                event: React.ChangeEvent<HTMLInputElement>
        ) => {
                setEdgeWeightInput(event.target.value);
                setEdgeWeightError("");
        };

        const handleEdgeWeightConfirm = () => {
                if (!modalState || modalState.type !== "edge-weight") {
                        return;
                }
                const trimmed = edgeWeightInput.trim();
                if (trimmed === "") {
                        finalizeEdgeCreation(modalState.sourceId, modalState.targetId, undefined);
                        setEdgeWeightInput("");
                        closeModal();
                        return;
                }
                const parsedWeight = Number(trimmed);
                if (Number.isNaN(parsedWeight)) {
                        setEdgeWeightError("Please enter a valid numeric weight.");
                        return;
                }
                finalizeEdgeCreation(modalState.sourceId, modalState.targetId, parsedWeight);
                setEdgeWeightDefault(trimmed);
                setEdgeWeightInput("");
                closeModal();
        };

        const handleNodeLabelConfirm = () => {
                if (!modalState || modalState.type !== "node-label") {
                        return;
                }
                const trimmedLabel = nodeLabelInput.trim() || modalState.nodeId;
                setGraph((previous) => {
                        const nodes = previous.nodes.map((candidate) =>
                                candidate.id === modalState.nodeId
                                        ? { ...candidate, label: trimmedLabel }
                                        : { ...candidate }
                        );
                        const edges = previous.edges.map((edge) => ({ ...edge }));
                        return rebuildGraph(nodes, edges, previous.directed);
                });
                closeModal();
        };

        const handleMessageModalConfirm = () => {
                if (!modalState || modalState.type !== "message") {
                        return;
                }
                const { onConfirm } = modalState;
                closeModal();
                onConfirm?.();
        };

        const handleNodeClick = (node: Node) => {
                setSelectedEdgeId(null);
                if (!editMode) {
                        setSelectedNodeId(node.id);
                        return;
                }
                if (!selectedNodeId) {
                        setSelectedNodeId(node.id);
                        return;
                }
                if (selectedNodeId === node.id) {
                        setSelectedNodeId(null);
                        return;
                }
                createEdgeBetweenNodes(selectedNodeId, node.id);
        };

        const handleNodeDoubleClick = (node: Node) => {
                if (!editMode) {
                        return;
                }
                setNodeLabelInput(node.label ?? node.id);
                setModalState({
                        type: "node-label",
                        title: "Edit Node Label",
                        nodeId: node.id,
                });
        };

        const handleEdgeClick = (edge: Edge) => {
                if (!editMode) {
                        return;
                }
                setSelectedEdgeId(edge.id);
                setSelectedNodeId(null);
        };

        const openCreateGraphModal = () => {
                setGraphCreationForm({
                        name: currentGraphName || "My Graph",
                        directed: graphType,
                        weightType: graphWeightType,
                });
                setGraphCreationError("");
                setModalState({ type: "create-graph", title: "Create New Graph" });
        };

        const handleCreateGraphConfirm = () => {
                const trimmedName = graphCreationForm.name.trim();
                if (!trimmedName) {
                        setGraphCreationError("Please provide a name for the new graph.");
                        return;
                }
                const isDirected = graphCreationForm.directed === "directed";
                const newGraph = new Graph([], [], isDirected);
                setGraph(newGraph);
                setCurrentGraphName(trimmedName);
                setGraphType(graphCreationForm.directed);
                setGraphWeightType(graphCreationForm.weightType);
                if (graphCreationForm.weightType === "unweighted") {
                        setEdgeWeightDefault("0");
                }
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                setEditMode(true);
                setSelectedSavedGraph("");
                setAlgorithmInstance(null);
                setAlgorithmState(createEmptyAlgorithmState());
                setAlgorithmSteps([]);
                setCurrentStepIndex(0);
                setAlgorithmComplete(false);
                closeModal();
        };

        const applyEdgeEdits = () => {
                if (!editMode) {
                        return;
                }
                if (!selectedEdgeId) {
                        return;
                }
                const currentEdge = graph.edges.find((edge) => edge.id === selectedEdgeId);
                if (!currentEdge) {
                        return;
                }
                const weightText = edgeEditor.weight.trim();
                let weightValue: number | undefined = currentEdge.weight;
                if (graphWeightType === "weighted") {
                        if (weightText !== "") {
                                const parsedWeight = Number(weightText);
                                if (Number.isNaN(parsedWeight)) {
                                        showMessageModal(
                                                "Invalid Weight",
                                                "Please enter a valid numeric weight."
                                        );
                                        return;
                                }
                                weightValue = parsedWeight;
                        } else {
                                weightValue = undefined;
                        }
                }

                const duplicateEdge = graph.edges.some(
                        (edge) =>
                                edge.id !== selectedEdgeId &&
                                edge.source.id === edgeEditor.sourceId &&
                                edge.target.id === edgeEditor.targetId
                );
                if (duplicateEdge) {
                        showMessageModal(
                                "Duplicate Edge",
                                "An edge with the selected source and target already exists."
                        );
                        return;
                }

                const nodes = graph.nodes.map((node) => ({ ...node }));
                const nodeMap = new Map(nodes.map((node) => [node.id, node]));
                if (!nodeMap.has(edgeEditor.sourceId) || !nodeMap.has(edgeEditor.targetId)) {
                        showMessageModal(
                                "Invalid Edge",
                                "Source or target node is invalid."
                        );
                        return;
                }

                const edges = graph.edges.map((edge) => {
                        if (edge.id !== selectedEdgeId) {
                                const source = nodeMap.get(edge.source.id);
                                const target = nodeMap.get(edge.target.id);
                                if (!source || !target) {
                                        throw new Error("Edge references missing while applying edits.");
                                }
                                return { ...edge, source, target };
                        }
                        const source = nodeMap.get(edgeEditor.sourceId)!;
                        const target = nodeMap.get(edgeEditor.targetId)!;
                        return {
                                ...edge,
                                source,
                                target,
                                weight: weightValue,
                        };
                });

                setGraph(new Graph(nodes, edges, graph.directed));
        };

        const handleCreateGraph = () => {
                openCreateGraphModal();
        };

        const renderModal = () => {
                if (!modalState) {
                        return null;
                }
                if (modalState.type === "message") {
                        return (
                                <Modal title={modalState.title} onClose={handleMessageModalConfirm}>
                                        <p style={{ marginBottom: "20px" }}>{modalState.message}</p>
                                        <div
                                                style={{
                                                        display: "flex",
                                                        justifyContent: "flex-end",
                                                        gap: "8px",
                                                }}
                                        >
                                                <button onClick={handleMessageModalConfirm}>OK</button>
                                        </div>
                                </Modal>
                        );
                }
                if (modalState.type === "edge-weight") {
                        return (
                                <Modal title={modalState.title} onClose={closeModal}>
                                        <div
                                                style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "12px",
                                                }}
                                        >
                                                <label htmlFor="edge-weight-input" style={{ fontWeight: 600 }}>
                                                        Edge Weight
                                                </label>
                                                <input
                                                        id="edge-weight-input"
                                                        value={edgeWeightInput}
                                                        onChange={handleEdgeWeightInputChange}
                                                        placeholder="Enter edge weight"
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                />
                                                {edgeWeightError && (
                                                        <span style={{ color: "#c62828" }}>{edgeWeightError}</span>
                                                )}
                                                <div
                                                        style={{
                                                                display: "flex",
                                                                justifyContent: "flex-end",
                                                                gap: "8px",
                                                        }}
                                                >
                                                        <button onClick={handleEdgeWeightConfirm}>Confirm</button>
                                                        <button onClick={closeModal}>Cancel</button>
                                                </div>
                                        </div>
                                </Modal>
                        );
                }
                if (modalState.type === "create-graph") {
                        return (
                                <Modal title={modalState.title} onClose={closeModal}>
                                        <div
                                                style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "12px",
                                                }}
                                        >
                                                <label htmlFor="graph-create-name" style={{ fontWeight: 600 }}>
                                                        Graph Name
                                                </label>
                                                <input
                                                        id="graph-create-name"
                                                        value={graphCreationForm.name}
                                                        onChange={(event) =>
                                                                setGraphCreationForm((previous) => ({
                                                                        ...previous,
                                                                        name: event.target.value,
                                                                }))
                                                        }
                                                        placeholder="Enter graph name"
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                />
                                                <label htmlFor="graph-create-type" style={{ fontWeight: 600 }}>
                                                        Graph Type
                                                </label>
                                                <select
                                                        id="graph-create-type"
                                                        value={graphCreationForm.directed}
                                                        onChange={(event) =>
                                                                setGraphCreationForm((previous) => ({
                                                                        ...previous,
                                                                        directed: event.target.value as
                                                                                | "directed"
                                                                                | "undirected",
                                                                }))
                                                        }
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                >
                                                        <option value="directed">Directed</option>
                                                        <option value="undirected">Undirected</option>
                                                </select>
                                                <label htmlFor="graph-create-weight" style={{ fontWeight: 600 }}>
                                                        Edge Weight Mode
                                                </label>
                                                <select
                                                        id="graph-create-weight"
                                                        value={graphCreationForm.weightType}
                                                        onChange={(event) =>
                                                                setGraphCreationForm((previous) => ({
                                                                        ...previous,
                                                                        weightType: event.target.value as
                                                                                | "weighted"
                                                                                | "unweighted",
                                                                }))
                                                        }
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                >
                                                        <option value="weighted">Weighted</option>
                                                        <option value="unweighted">Unweighted</option>
                                                </select>
                                                {graphCreationError && (
                                                        <span style={{ color: "#c62828" }}>{graphCreationError}</span>
                                                )}
                                                <div
                                                        style={{
                                                                display: "flex",
                                                                justifyContent: "flex-end",
                                                                gap: "8px",
                                                        }}
                                                >
                                                        <button onClick={handleCreateGraphConfirm}>Create</button>
                                                        <button onClick={closeModal}>Cancel</button>
                                                </div>
                                        </div>
                                </Modal>
                        );
                }
                if (modalState.type === "node-label") {
                        return (
                                <Modal title={modalState.title} onClose={closeModal}>
                                        <div
                                                style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "12px",
                                                }}
                                        >
                                                <label htmlFor="node-label-input" style={{ fontWeight: 600 }}>
                                                        Node Label
                                                </label>
                                                <input
                                                        id="node-label-input"
                                                        value={nodeLabelInput}
                                                        onChange={(event) => setNodeLabelInput(event.target.value)}
                                                        placeholder="Enter node label"
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                />
                                                <div
                                                        style={{
                                                                display: "flex",
                                                                justifyContent: "flex-end",
                                                                gap: "8px",
                                                        }}
                                                >
                                                        <button onClick={handleNodeLabelConfirm}>Apply</button>
                                                        <button onClick={closeModal}>Cancel</button>
                                                </div>
                                        </div>
                                </Modal>
                        );
                }
                return null;
        };

        const handleSaveGraph = () => {
                if (!currentGraphName.trim()) {
                        showMessageModal(
                                "Missing Name",
                                "Please provide a name before saving the graph."
                        );
                        return;
                }
                const serialized = graph.toSerialized();
                const updatedGraphs = [
                        ...savedGraphs.filter((entry) => entry.name !== currentGraphName.trim()),
                        { name: currentGraphName.trim(), data: serialized },
                ];
                setSavedGraphs(updatedGraphs);
                saveGraphsToStorage(updatedGraphs);
                showMessageModal("Graph Saved", "Graph saved locally.");
        };

        const handleLoadSavedGraph = (
                event: React.ChangeEvent<HTMLSelectElement>
        ) => {
                const value = event.target.value;
                setSelectedSavedGraph(value);
                if (!value) {
                        return;
                }
                const entry = savedGraphs.find((candidate) => candidate.name === value);
                if (!entry) {
                        return;
                }
                try {
                        const loadedGraph = Graph.fromSerialized(entry.data);
                        const nextWeightType = loadedGraph.edges.some(
                                (edge) => edge.weight !== undefined && edge.weight !== null && edge.weight !== 0
                        )
                                ? "weighted"
                                : "unweighted";
                        const processedGraph =
                                nextWeightType === "unweighted"
                                        ? loadedGraph.clone({
                                                edges: loadedGraph.edges.map((edge) => ({
                                                        ...edge,
                                                        weight: 0,
                                                })),
                                        })
                                        : loadedGraph;
                        setGraph(processedGraph);
                        setGraphWeightType(nextWeightType);
                        setGraphCreationForm((previous) => ({
                                ...previous,
                                directed: processedGraph.directed ? "directed" : "undirected",
                                weightType: nextWeightType,
                        }));
                        if (nextWeightType === "unweighted") {
                                setEdgeWeightDefault("0");
                        }
                        setCurrentGraphName(entry.name);
                        setSelectedNodeId(null);
                        setSelectedEdgeId(null);
                        setEditMode(false);
                } catch (error) {
                        showMessageModal(
                                "Load Failed",
                                "Failed to load the selected graph."
                        );
                        console.error(error);
                }
        };

        const handleImportGraph = (
                event: React.ChangeEvent<HTMLInputElement>
        ) => {
                const file = event.target.files?.[0];
                if (!file) {
                        return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                        try {
                                const parsed = JSON.parse(reader.result as string);
                                const importedGraph = Graph.fromSerialized(parsed);
                                const nextWeightType = importedGraph.edges.some(
                                        (edge) =>
                                                edge.weight !== undefined &&
                                                edge.weight !== null &&
                                                edge.weight !== 0
                                )
                                        ? "weighted"
                                        : "unweighted";
                                const processedGraph =
                                        nextWeightType === "unweighted"
                                                ? importedGraph.clone({
                                                        edges: importedGraph.edges.map((edge) => ({
                                                                ...edge,
                                                                weight: 0,
                                                        })),
                                                })
                                                : importedGraph;
                                const name = file.name.replace(/\.json$/i, "");
                                setGraph(processedGraph);
                                setGraphWeightType(nextWeightType);
                                setGraphCreationForm((previous) => ({
                                        ...previous,
                                        directed: processedGraph.directed ? "directed" : "undirected",
                                        weightType: nextWeightType,
                                }));
                                if (nextWeightType === "unweighted") {
                                        setEdgeWeightDefault("0");
                                }
                                setCurrentGraphName(name);
                                setSelectedNodeId(null);
                                setSelectedEdgeId(null);
                                setEditMode(false);
                                setSelectedSavedGraph("");
                        } catch (error) {
                                showMessageModal(
                                        "Import Failed",
                                        "The selected file is not a valid graph JSON file."
                                );
                                console.error(error);
                        }
                };
                reader.readAsText(file);
                event.target.value = "";
        };

        const handleExportGraph = () => {
                const serialized = JSON.stringify(graph.toSerialized(), null, 2);
                const blob = new Blob([serialized], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${currentGraphName || "graph"}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
        };

        const totalSteps = algorithmSteps.length;
        const hasAlgorithm = algorithmInstance !== null;
        const disableFirst =
                !hasAlgorithm || totalSteps === 0 || currentStepIndex === 0;
        const disablePrevious = disableFirst;
        const disableLast =
                !hasAlgorithm || totalSteps === 0 || currentStepIndex === totalSteps - 1;
        const disableNext =
                !hasAlgorithm ||
                totalSteps === 0 ||
                (currentStepIndex === totalSteps - 1 && algorithmComplete);
        const disableSlider = !hasAlgorithm || totalSteps <= 1;
        const disableReset = !hasAlgorithm;
        const selectedEdge = graph.edges.find((edge) => edge.id === selectedEdgeId) || null;

        return (
                <>
                        <div
                                style={{
                                        display: "flex",
                                        height: "100vh",
                                        overflow: "hidden",
                                        backgroundColor: "#f0f2f5",
                                color: "#1f2933",
                        }}
                >
                        <div
                                style={{
                                        width: "340px",
                                        padding: "20px",
                                        overflowY: "auto",
                                        boxSizing: "border-box",
                                        backgroundColor: "#ffffff",
                                        borderRight: "1px solid #d3d8de",
                                }}
                        >
                                <h1 style={{ fontSize: "22px", marginTop: 0 }}>Graph Algorithm Visualizer</h1>

                                <AccordionSection
                                        title="Graph Management"
                                        isOpen={graphSectionOpen}
                                        onToggle={() =>
                                                setGraphSectionOpen((previous) => !previous)
                                        }
                                >
                                        <div
                                                style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "10px",
                                                }}
                                        >
                                                <label htmlFor="graph-name" style={{ fontWeight: 600 }}>
                                                        Graph Name
                                                </label>
                                                <input
                                                        id="graph-name"
                                                        value={currentGraphName}
                                                        onChange={(event) => setCurrentGraphName(event.target.value)}
                                                        placeholder="Enter graph name"
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                />
                                        </div>

                                        <div
                                                style={{
                                                        marginTop: "16px",
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: "8px",
                                                }}
                                        >
                                                <button onClick={handleCreateGraph}>New Graph</button>
                                                <button onClick={handleSaveGraph}>Save Graph</button>
                                                <button onClick={handleExportGraph}>Export Graph</button>
                                        </div>

                                        <div
                                                style={{
                                                        marginTop: "16px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                }}
                                        >
                                                <label htmlFor="load-graph" style={{ fontWeight: 600 }}>
                                                        Load Saved Graph
                                                </label>
                                                <select
                                                        id="load-graph"
                                                        value={selectedSavedGraph}
                                                        onChange={handleLoadSavedGraph}
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                >
                                                        <option value="">Select...</option>
                                                        {savedGraphs.map((entry) => (
                                                                <option key={entry.name} value={entry.name}>
                                                                        {entry.name}
                                                                </option>
                                                        ))}
                                                </select>
                                        </div>

                                        <div
                                                style={{
                                                        marginTop: "16px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                }}
                                        >
                                                <label htmlFor="import-graph" style={{ fontWeight: 600 }}>
                                                        Import Graph (JSON)
                                                </label>
                                                <input
                                                        id="import-graph"
                                                        type="file"
                                                        accept="application/json"
                                                        onChange={handleImportGraph}
                                                />
                                        </div>

                                        <div
                                                style={{
                                                        marginTop: "16px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                }}
                                        >
                                                <label htmlFor="graph-type" style={{ fontWeight: 600 }}>
                                                        Graph Type
                                                </label>
                                                <select
                                                        id="graph-type"
                                                        value={graphType}
                                                        onChange={handleGraphTypeChange}
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                >
                                                        <option value="directed">Directed</option>
                                                        <option value="undirected">Undirected</option>
                                                </select>
                                        </div>
                                        <div
                                                style={{
                                                        marginTop: "16px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                }}
                                        >
                                                <label htmlFor="graph-weight-type" style={{ fontWeight: 600 }}>
                                                        Edge Weight Mode
                                                </label>
                                                <select
                                                        id="graph-weight-type"
                                                        value={graphWeightType}
                                                        onChange={handleGraphWeightTypeChange}
                                                        style={{
                                                                padding: "8px",
                                                                border: "1px solid #c4cbd6",
                                                                borderRadius: "4px",
                                                        }}
                                                >
                                                        <option value="weighted">Weighted</option>
                                                        <option value="unweighted">Unweighted</option>
                                                </select>
                                        </div>

                                        <div style={{ marginTop: "16px" }}>
                                                <button onClick={() => setEditMode((previous) => !previous)}>
                                                        {editMode ? "Exit Edit Mode" : "Edit Graph"}
                                                </button>
                                        </div>
                                </AccordionSection>


                                <AccordionSection
                                        title="Algorithm Management"
                                        isOpen={algorithmSectionOpen}
                                        onToggle={() =>
                                                setAlgorithmSectionOpen((previous) => !previous)
                                        }
                                >
                                        {editMode ? (
                                                <p style={{ color: "#52606d", margin: 0 }}>
                                                        Exit edit mode to run algorithms.
                                                </p>
                                        ) : (
                                                <>
                                                        <AlgorithmSelector
                                                                algorithms={Object.keys(algorithms)}
                                                                onSelectAlgorithm={handleSelectAlgorithm}
                                                        />
                                                        <div style={{ marginTop: "12px" }}>
                                                                <Controls
                                                                        currentStep={currentStepIndex}
                                                                        totalSteps={totalSteps}
                                                                        onFirstStep={handleFirstStep}
                                                                        onPreviousStep={handlePreviousStep}
                                                                        onNextStep={handleNextStep}
                                                                        onLastStep={handleLastStep}
                                                                        onReset={handleReset}
                                                                        onStepChange={handleStepChange}
                                                                        disableFirst={disableFirst}
                                                                        disablePrevious={disablePrevious}
                                                                        disableNext={disableNext}
                                                                        disableLast={disableLast}
                                                                        disableReset={disableReset}
                                                                        disableSlider={disableSlider}
                                                                />
                                                        </div>
                                                        <div style={{ marginTop: "16px" }}>
                                                                <AlgorithmStepInfo
                                                                        steps={algorithmSteps}
                                                                        currentStepIndex={currentStepIndex}
                                                                        onSelectStep={handleStepChange}
                                                                />
                                                        </div>
                                                </>
                                        )}
                                </AccordionSection>


                                {editMode && selectedEdge && (
                                        <section style={{ marginTop: "32px" }}>
                                                <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Edit Edge</h2>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                        <label htmlFor="edge-source" style={{ fontWeight: 600 }}>
                                                                Source
                                                        </label>
                                                        <select
                                                                id="edge-source"
                                                                value={edgeEditor.sourceId}
                                                                onChange={(event) =>
                                                                        setEdgeEditor((previous) => ({
                                                                                ...previous,
                                                                                sourceId: event.target.value,
                                                                        }))
                                                                }
                                                                style={{
                                                                        padding: "8px",
                                                                        border: "1px solid #c4cbd6",
                                                                        borderRadius: "4px",
                                                                }}
                                                        >
                                                                {graph.nodes.map((node) => (
                                                                        <option key={node.id} value={node.id}>
                                                                                {node.label || node.id}
                                                                        </option>
                                                                ))}
                                                        </select>

                                                        <label htmlFor="edge-target" style={{ fontWeight: 600 }}>
                                                                Target
                                                        </label>
                                                        <select
                                                                id="edge-target"
                                                                value={edgeEditor.targetId}
                                                                onChange={(event) =>
                                                                        setEdgeEditor((previous) => ({
                                                                                ...previous,
                                                                                targetId: event.target.value,
                                                                        }))
                                                                }
                                                                style={{
                                                                        padding: "8px",
                                                                        border: "1px solid #c4cbd6",
                                                                        borderRadius: "4px",
                                                                }}
                                                        >
                                                                {graph.nodes.map((node) => (
                                                                        <option key={node.id} value={node.id}>
                                                                                {node.label || node.id}
                                                                        </option>
                                                                ))}
                                                        </select>

                                                        <label htmlFor="edge-weight" style={{ fontWeight: 600 }}>
                                                                Weight
                                                        </label>
                                                        <input
                                                                id="edge-weight"
                                                                value={edgeEditor.weight}
                                                                onChange={(event) =>
                                                                        setEdgeEditor((previous) => ({
                                                                                ...previous,
                                                                                weight: event.target.value,
                                                                        }))
                                                                }
                                                                placeholder="Optional weight"
                                                                disabled={graphWeightType === "unweighted"}
                                                                style={{
                                                                        padding: "8px",
                                                                        border: "1px solid #c4cbd6",
                                                                        borderRadius: "4px",
                                                                }}
                                                        />

                                                        {graphWeightType === "unweighted" && (
                                                                <span style={{ color: "#52606d" }}>
                                                                        Edge weights are disabled for unweighted graphs.
                                                                </span>
                                                        )}

                                                        <button onClick={applyEdgeEdits} style={{ marginTop: "8px" }}>
                                                                Apply Edge Changes
                                                        </button>
                                                </div>
                                        </section>
                                )}
                        </div>

                        <div
                                style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        padding: "20px",
                                        boxSizing: "border-box",
                                        minWidth: 0,
                                        minHeight: 0,
                                }}
                        >
                                <div
                                        style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                minHeight: 0,
                                        }}
                                >
                                        <div
                                                style={{
                                                        flex: 1,
                                                        minHeight: 0,
                                                        border: "1px solid #cfd7e3",
                                                        borderRadius: "8px",
                                                        backgroundColor: "#fafafa",
                                                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
                                                        overflow: "hidden",
                                                }}
                                        >
                                                <GraphCanvas
                                                        graph={graph}
                                                        algorithmState={algorithmState}
                                                        editMode={editMode}
                                                        selectedNodeId={selectedNodeId}
                                                        selectedEdgeId={selectedEdgeId}
                                                        showWeights={graphWeightType === "weighted"}
                                                        onCanvasClick={handleCanvasClick}
                                                        onNodeClick={handleNodeClick}
                                                        onNodeDoubleClick={handleNodeDoubleClick}
                                                        onEdgeClick={handleEdgeClick}
                                                        onNodePositionChange={handleNodePositionChange}
                                                        onNodeDelete={handleNodeDelete}
                                                />
                                        </div>
                                        {editMode && (
                                                <p
                                                        style={{
                                                                marginTop: "12px",
                                                                textAlign: "center",
                                                                color: "#52606d",
                                                        }}
                                                >
                                                        Click anywhere on the canvas to add nodes. Click two nodes in
                                                        succession to create an edge, drag nodes to reposition them,
                                                        and drop nodes onto the trashcan to delete them.
                                                </p>
                                        )}
                                </div>
                        </div>
                        </div>
                        {renderModal()}
                </>
        );
};

export default App;
