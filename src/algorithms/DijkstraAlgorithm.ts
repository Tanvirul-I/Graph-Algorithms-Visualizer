import { Algorithm, AlgorithmState } from "./Algorithm";
import { Graph } from "../models/Graph";
import { Node } from "../models/Node";
import { Edge } from "../models/Edge";

export class DijkstraAlgorithm implements Algorithm {
        private graph!: Graph;
        private state!: AlgorithmState;
        private priorityQueue!: Node[];
        private distances!: Map<Node, number>;
        private previousNodes!: Map<Node, Node | null>;
        private settledNodes!: Set<Node>;
        private shortestTreeEdges!: Set<Edge>;
        private previousEdges!: Map<Node, Edge | null>;
        private stepInfo = "";
        private highlightedNodesSet!: Set<string>;

        initialize(graph: Graph): void {
                this.graph = graph;
                this.state = {
                        highlightedNodes: [],
                        highlightedEdges: [],
                        currentNodes: [],
                        currentEdges: [],
                        nodeValues: {},
                };
                this.priorityQueue = [];
                this.distances = new Map<Node, number>();
                this.previousNodes = new Map<Node, Node | null>();
                this.previousEdges = new Map<Node, Edge | null>();
                this.settledNodes = new Set<Node>();
                this.shortestTreeEdges = new Set<Edge>();

                const startNode = graph.nodes[0];
                this.distances.set(startNode, 0);
                this.priorityQueue.push(startNode);
                this.previousNodes.set(startNode, null);
                this.previousEdges.set(startNode, null);
                this.highlightedNodesSet = new Set<string>([startNode.id]);
                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.state.nodeValues[startNode.id] = 0;
                this.state.currentNodes = [startNode.id];
                this.state.currentEdges = [];
                this.stepInfo = `Initialized Dijkstra's Algorithm with start node ${startNode.id}.`;
        }

        step(): boolean {
                if (this.priorityQueue.length === 0) {
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        this.stepInfo = "All reachable nodes have been settled.";
                        return false;
                }

                this.stepInfo = "";

                this.priorityQueue.sort(
                        (a, b) =>
                                (this.distances.get(a) ?? Infinity) -
                                (this.distances.get(b) ?? Infinity)
                );

                const currentNode = this.priorityQueue.shift()!;
                this.settledNodes.add(currentNode);
                this.highlightedNodesSet.add(currentNode.id);
                this.state.highlightedEdges = [];
                const stepNodes: string[] = [currentNode.id];
                const stepEdges: string[] = [];

                const neighbors = this.graph.getNeighbors(currentNode);
                neighbors.forEach(({ node: neighborNode, weight, edge }) => {
                        if (!this.settledNodes.has(neighborNode)) {
                                const newDist = (this.distances.get(currentNode) ?? Infinity) + weight;
                                if (newDist < (this.distances.get(neighborNode) ?? Infinity)) {
                                        this.distances.set(neighborNode, newDist);
                                        this.priorityQueue.push(neighborNode);
                                        this.previousNodes.set(neighborNode, currentNode);
                                        this.state.nodeValues[neighborNode.id] = newDist;
                                        this.highlightedNodesSet.add(neighborNode.id);
                                        stepNodes.push(neighborNode.id);

                                        const previousEdge = this.previousEdges.get(neighborNode);
                                        if (previousEdge) {
                                                this.shortestTreeEdges.delete(previousEdge);
                                        }

                                        this.shortestTreeEdges.add(edge);
                                        this.previousEdges.set(neighborNode, edge);
                                        stepEdges.push(edge.id);

                                        const weightText = edge.weight !== undefined ? edge.weight : weight;
                                        this.stepInfo += `Updated node ${neighborNode.id} via edge ${edge.source.id}, ${edge.target.id} with weight ${weightText}; new distance is ${newDist}.<br>`;
                                }
                        }
                });

                this.updateHighlightedEdges();
                this.stepInfo += `Selected node ${currentNode.id} with distance ${this.distances.get(currentNode)}.`;
                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.state.currentNodes = stepNodes;
                this.state.currentEdges = stepEdges;

                return true;
        }

        private updateHighlightedEdges() {
                this.state.highlightedEdges = Array.from(this.shortestTreeEdges).map(
                        (edge) => edge.id
                );
        }

        getState(): AlgorithmState {
                return this.state;
        }

        getStepInfo(): string {
                return this.stepInfo;
        }
}
