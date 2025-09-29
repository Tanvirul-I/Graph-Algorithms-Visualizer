import { Algorithm, AlgorithmState } from "./Algorithm";
import { Graph } from "../models/Graph";
import { Node } from "../models/Node";

export class AStarAlgorithm implements Algorithm {
        private graph!: Graph;
        private state!: AlgorithmState;
        private openSet!: Node[];
        private cameFrom!: Map<string, string | null>;
        private cameFromEdge!: Map<string, string | null>;
        private gScore!: Map<string, number>;
        private fScore!: Map<string, number>;
        private stepInfo = "";
        private startNode!: Node;
        private targetNode!: Node | null;
        private foundTarget!: boolean;
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
                this.openSet = [];
                this.cameFrom = new Map<string, string | null>();
                this.cameFromEdge = new Map<string, string | null>();
                this.gScore = new Map<string, number>();
                this.fScore = new Map<string, number>();
                this.startNode = graph.nodes[0];
                this.targetNode =
                        graph.nodes[Math.floor(Math.random() * graph.nodes.length)] || null;
                if (!this.targetNode) {
                        throw new Error("A* requires at least one target node.");
                }
                this.openSet.push(this.startNode);
                this.gScore.set(this.startNode.id, 0);
                this.fScore.set(
                        this.startNode.id,
                        this.heuristic(this.startNode, this.targetNode)
                );
                this.cameFrom.set(this.startNode.id, null);
                this.cameFromEdge.set(this.startNode.id, null);
                this.highlightedNodesSet = new Set<string>([
                        this.startNode.id,
                        this.targetNode.id,
                ]);
                this.highlightedEdgesSet = new Set<string>();
                this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                this.state.currentNodes = [this.startNode.id];
                this.state.currentEdges = [];
                this.stepInfo = `Initialized A* with start node ${this.startNode.id} and target node ${this.targetNode.id}.`;
                this.foundTarget = false;
        }

        step(): boolean {
                if (this.openSet.length === 0 || this.foundTarget) {
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        return false;
                }

                this.openSet.sort(
                        (a, b) =>
                                (this.fScore.get(a.id) ?? Infinity) -
                                (this.fScore.get(b.id) ?? Infinity)
                );
                const currentNode = this.openSet.shift()!;
                this.highlightedNodesSet.add(currentNode.id);
                this.stepInfo = `Visiting node ${currentNode.id}.`;
                const stepNodes: string[] = [currentNode.id];
                const stepEdges: string[] = [];

                if (currentNode.id === this.targetNode!.id) {
                        this.foundTarget = true;
                        this.stepInfo += `<br>Target node ${currentNode.id} found.`;
                        this.reconstructPath(currentNode.id);
                        this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                        this.state.highlightedEdges = Array.from(this.highlightedEdgesSet);
                        this.state.currentNodes = [currentNode.id];
                        this.state.currentEdges = [];
                        return true;
                }

                const neighbors = this.graph.getNeighbors(currentNode);
                neighbors.forEach(({ node: neighbor, weight, edge }) => {
                        const tentativeGScore =
                                (this.gScore.get(currentNode.id) ?? Infinity) + weight;
                        if (tentativeGScore < (this.gScore.get(neighbor.id) ?? Infinity)) {
                                const previousEdgeId = this.cameFromEdge.get(neighbor.id);
                                if (previousEdgeId) {
                                        this.highlightedEdgesSet.delete(previousEdgeId);
                                }
                                this.cameFrom.set(neighbor.id, currentNode.id);
                                this.cameFromEdge.set(neighbor.id, edge.id);
                                this.gScore.set(neighbor.id, tentativeGScore);
                                this.fScore.set(
                                        neighbor.id,
                                        tentativeGScore + this.heuristic(neighbor, this.targetNode!)
                                );
                                if (!this.openSet.find((node) => node.id === neighbor.id)) {
                                        this.openSet.push(neighbor);
                                }
                                this.highlightedEdgesSet.add(edge.id);
                                this.highlightedNodesSet.add(neighbor.id);
                                stepNodes.push(neighbor.id);
                                stepEdges.push(edge.id);
                                const weightText = edge.weight !== undefined ? edge.weight : weight;
                                this.stepInfo += `<br>Discovered node ${neighbor.id} via edge ${edge.source.id}, ${edge.target.id} with weight ${weightText}; gScore is ${tentativeGScore}.`;
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

        private heuristic(a: Node, b: Node): number {
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                return Math.sqrt(dx * dx + dy * dy);
        }

        private reconstructPath(nodeId: string) {
                let currentId: string | null = nodeId;
                while (currentId) {
                        this.highlightedNodesSet.add(currentId);
                        const edgeId = this.cameFromEdge.get(currentId);
                        if (edgeId) {
                                this.highlightedEdgesSet.add(edgeId);
                        }
                        const previousId: string | null = this.cameFrom.get(currentId) ?? null;
                        if (!previousId || previousId === currentId) {
                                break;
                        }
                        currentId = previousId;
                }
        }
}
