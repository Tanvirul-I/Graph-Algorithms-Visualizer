import { Graph } from "../models/Graph";

export interface AlgorithmState {
        highlightedNodes: string[];
        highlightedEdges: string[];
        currentNodes: string[];
        currentEdges: string[];
        nodeValues: { [key: string]: number };
}

export interface Algorithm {
        initialize(graph: Graph): void;
        step(): boolean; // Returns true if there are more steps
        getState(): AlgorithmState;
        getStepInfo(): string;
}

export interface AlgorithmStepRecord {
        state: AlgorithmState;
        description: string;
}
