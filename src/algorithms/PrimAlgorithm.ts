import { Algorithm, AlgorithmState } from "./Algorithm";
import { Graph } from "../models/Graph";
import { Edge } from "../models/Edge";
import { Node } from "../models/Node";

export class PrimAlgorithm implements Algorithm {
        private graph!: Graph;
        private state!: AlgorithmState;
        private mstEdges!: Edge[];
        private visited!: Set<string>;
        private edgeQueue!: Edge[];
        private stepInfo = "";
        private startNode!: Node;
        private highlightedNodesSet!: Set<string>;
        private highlightedEdgesSet!: Set<string>;

        initialize(graph: Graph): void {
                this.graph = graph;
                this.state = {
                        highlightedNodes: [],
                        highlightedEdges: [],
                        currentNodes: [],
                        currentEdges: [],
                        nodeValues: {},
                };
                this.mstEdges = [];
                this.visited = new Set<string>();
                this.edgeQueue = [];
                this.startNode = graph.nodes[0];
                this.visited.add(this.startNode.id);
                this.highlightedNodesSet = new Set<string>([this.startNode.id]);
                this.highlightedEdgesSet = new Set<string>();
                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.state.highlightedEdges = [];
                this.state.currentNodes = [this.startNode.id];
                this.state.currentEdges = [];
                this.stepInfo = `Initialized Prim's Algorithm with start node ${this.startNode.id}.`;
                this.graph.getNeighbors(this.startNode).forEach(({ edge }) => {
                        this.edgeQueue.push(edge);
                });
        }

        step(): boolean {
                if (this.edgeQueue.length === 0) {
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        this.stepInfo = "All edges have been considered.";
                        return false;
                }

                this.edgeQueue.sort((a, b) => (a.weight || 0) - (b.weight || 0));
                const edge = this.edgeQueue.shift()!;

                const source = edge.source.id;
                const target = edge.target.id;
                const weightText = edge.weight !== undefined ? edge.weight : 0;
                this.state.currentNodes = [source, target];
                this.state.currentEdges = [edge.id];

                if (this.visited.has(source) && this.visited.has(target)) {
                        this.stepInfo = `Skipped edge ${source}, ${target} with weight ${weightText} because both nodes are already in the MST.`;
                        this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                        this.state.highlightedEdges = Array.from(this.highlightedEdgesSet);
                        return true;
                }

                const newNodeId = this.visited.has(source) ? target : source;
                this.visited.add(newNodeId);
                this.mstEdges.push(edge);
                this.highlightedEdgesSet.add(edge.id);
                this.highlightedNodesSet.add(source);
                this.highlightedNodesSet.add(target);
                this.highlightedNodesSet.add(newNodeId);
                this.state.highlightedEdges = Array.from(this.highlightedEdgesSet);
                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.stepInfo = `Added edge ${source}, ${target} with weight ${weightText} to the MST and visited node ${newNodeId}.`;

                const newNode = this.graph.getNodeById(newNodeId);
                if (newNode) {
                        this.graph.getNeighbors(newNode).forEach(({ edge: neighborEdge }) => {
                                if (
                                        !this.visited.has(neighborEdge.target.id) ||
                                        !this.visited.has(neighborEdge.source.id)
                                ) {
                                        this.edgeQueue.push(neighborEdge);
                                }
                        });
                }

                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.state.highlightedEdges = Array.from(this.highlightedEdgesSet);

                return true;
        }

        getState(): AlgorithmState {
                return this.state;
        }

        getStepInfo(): string {
                return this.stepInfo;
        }
}
