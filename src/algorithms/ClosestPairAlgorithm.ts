import { Algorithm, AlgorithmState } from "./Algorithm";
import { Graph } from "../models/Graph";
import { Node } from "../models/Node";

export class ClosestPairAlgorithm implements Algorithm {
        private graph!: Graph;
        private state!: AlgorithmState;
        private nodes: Node[] = [];
        private i = 0;
        private j = 1;
        private bestPair: [Node, Node] | null = null;
        private bestDistance = Infinity;
        private stepInfo = "";

        initialize(graph: Graph): void {
                this.graph = graph;
                this.state = {
                        highlightedNodes: [],
                        highlightedEdges: [],
                        currentNodes: [],
                        currentEdges: [],
                        nodeValues: {},
                };
                this.nodes = [...graph.nodes];
                this.i = 0;
                this.j = 1;
                this.bestPair = null;
                this.bestDistance = Infinity;

                if (this.nodes.length < 2) {
                        this.stepInfo = "At least two nodes are required to compute the closest pair.";
                        this.state.highlightedNodes = this.nodes.map((node) => node.id);
                        this.state.currentNodes = [...this.state.highlightedNodes];
                        this.state.currentEdges = [];
                        return;
                }

                this.stepInfo = "Initialized closest pair search.";
                this.state.currentNodes = [];
                this.state.currentEdges = [];
        }

        step(): boolean {
                if (this.nodes.length < 2) {
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        return false;
                }

                if (this.i >= this.nodes.length - 1) {
                        this.presentBestPairResult("Closest pair identified.");
                        return false;
                }

                const first = this.nodes[this.i];
                const second = this.nodes[this.j];
                const distance = this.distanceBetween(first, second);

                this.state.currentNodes = [first.id, second.id];

                const highlighted = new Set<string>();
                highlighted.add(first.id);
                highlighted.add(second.id);
                if (this.bestPair) {
                        highlighted.add(this.bestPair[0].id);
                        highlighted.add(this.bestPair[1].id);
                }
                this.state.highlightedNodes = Array.from(highlighted);

                const edges = new Set<string>();
                const comparisonEdge = this.findEdgeBetween(first, second);
                if (comparisonEdge) {
                        edges.add(comparisonEdge.id);
                        this.state.currentEdges = [comparisonEdge.id];
                } else {
                        this.state.currentEdges = [];
                }
                if (this.bestPair) {
                        const bestEdge = this.findEdgeBetween(this.bestPair[0], this.bestPair[1]);
                        if (bestEdge) {
                                edges.add(bestEdge.id);
                        }
                }
                this.state.highlightedEdges = Array.from(edges);

                let info = `Comparing ${first.id} and ${second.id}; distance = ${distance.toFixed(2)}.`;
                if (distance < this.bestDistance) {
                        this.bestDistance = distance;
                        this.bestPair = [first, second];
                        info += "<br>Updated closest pair.";
                }
                this.stepInfo = info;

                this.state.nodeValues = {};
                if (this.bestPair) {
                        const formatted = Number(this.bestDistance.toFixed(2));
                        this.state.nodeValues[this.bestPair[0].id] = formatted;
                        this.state.nodeValues[this.bestPair[1].id] = formatted;
                }

                this.advanceIndices();
                return true;
        }

        getState(): AlgorithmState {
                return this.state;
        }

        getStepInfo(): string {
                return this.stepInfo;
        }

        private advanceIndices() {
                this.j += 1;
                if (this.j >= this.nodes.length) {
                        this.i += 1;
                        this.j = this.i + 1;
                }
        }

        private presentBestPairResult(message: string) {
                this.state.highlightedEdges = [];
                if (!this.bestPair) {
                        this.stepInfo = "Could not determine a closest pair.";
                        this.state.highlightedNodes = [];
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        this.state.nodeValues = {};
                        return;
                }

                this.state.highlightedNodes = [
                        this.bestPair[0].id,
                        this.bestPair[1].id,
                ];
                const bestEdge = this.findEdgeBetween(this.bestPair[0], this.bestPair[1]);
                this.state.highlightedEdges = bestEdge ? [bestEdge.id] : [];
                this.state.currentNodes = [...this.state.highlightedNodes];
                this.state.currentEdges = bestEdge ? [bestEdge.id] : [];
                const formatted = Number(this.bestDistance.toFixed(2));
                this.state.nodeValues = {
                        [this.bestPair[0].id]: formatted,
                        [this.bestPair[1].id]: formatted,
                };
                this.stepInfo = `${message} Distance: ${formatted}.`;
        }

        private distanceBetween(first: Node, second: Node): number {
                const dx = first.x - second.x;
                const dy = first.y - second.y;
                return Math.hypot(dx, dy);
        }

        private findEdgeBetween(first: Node, second: Node) {
                return this.graph.edges.find((edge) => {
                        if (edge.source.id === first.id && edge.target.id === second.id) {
                                return true;
                        }
                        if (!this.graph.directed && edge.source.id === second.id && edge.target.id === first.id) {
                                return true;
                        }
                        return false;
                });
        }
}
