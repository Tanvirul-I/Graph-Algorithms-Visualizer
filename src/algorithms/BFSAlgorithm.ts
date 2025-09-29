import { Algorithm, AlgorithmState } from "./Algorithm";
import { Graph } from "../models/Graph";
import { Node } from "../models/Node";

export class BFSAlgorithm implements Algorithm {
        private graph!: Graph;
        private state!: AlgorithmState;
        private queue!: Node[];
        private visited!: Set<string>;
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
                this.queue = [];
                this.visited = new Set<string>();
                this.startNode = graph.nodes[0];
                this.queue.push(this.startNode);
                this.visited.add(this.startNode.id);
                this.highlightedNodesSet = new Set<string>([this.startNode.id]);
                this.highlightedEdgesSet = new Set<string>();
                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.state.highlightedEdges = [];
                this.state.currentNodes = [this.startNode.id];
                this.state.currentEdges = [];
                this.stepInfo = `Initialized BFS with start node ${this.startNode.id}.`;
        }

        step(): boolean {
                if (this.queue.length === 0) {
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        this.stepInfo += `<br>BFS traversal completed. All reachable nodes have been visited.`;
                        return false;
                }

                const currentNode = this.queue.shift()!;
                this.highlightedNodesSet.add(currentNode.id);
                this.stepInfo = `Visiting node ${currentNode.id}.`;

                const stepNodes: string[] = [currentNode.id];
                const stepEdges: string[] = [];

                const neighbors = this.graph.getNeighbors(currentNode);
                neighbors.forEach(({ node: neighbor, edge }) => {
                        if (!this.visited.has(neighbor.id)) {
                                this.queue.push(neighbor);
                                this.visited.add(neighbor.id);
                                this.highlightedNodesSet.add(neighbor.id);
                                this.highlightedEdgesSet.add(edge.id);
                                stepNodes.push(neighbor.id);
                                stepEdges.push(edge.id);
                                const weightText = edge.weight !== undefined ? edge.weight : 1;
                                this.stepInfo += `<br>Enqueued node ${neighbor.id} via edge ${edge.source.id}, ${edge.target.id} with weight ${weightText}.`;
                        }
                });

                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.state.highlightedEdges = Array.from(this.highlightedEdgesSet);
                this.state.currentNodes = stepNodes;
                this.state.currentEdges = stepEdges;

                return true;
        }

        getState(): AlgorithmState {
                return this.state;
        }

        getStepInfo(): string {
                return this.stepInfo;
        }
}
