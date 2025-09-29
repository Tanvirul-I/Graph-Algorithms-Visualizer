import { Algorithm, AlgorithmState } from "./Algorithm";
import { Graph } from "../models/Graph";
import { Edge } from "../models/Edge";

class UnionFind {
        parent: Map<string, string>;

        constructor(nodes: string[]) {
                this.parent = new Map<string, string>();
                nodes.forEach((node) => this.parent.set(node, node));
        }

        find(node: string): string {
                if (this.parent.get(node) !== node) {
                        this.parent.set(node, this.find(this.parent.get(node)!));
                }
                return this.parent.get(node)!;
        }

        union(node1: string, node2: string): void {
                const root1 = this.find(node1);
                const root2 = this.find(node2);
                if (root1 !== root2) {
                        this.parent.set(root1, root2);
                }
        }

        connected(node1: string, node2: string): boolean {
                return this.find(node1) === this.find(node2);
        }
}

export class KruskalAlgorithm implements Algorithm {
        private graph!: Graph;
        private state!: AlgorithmState;
        private edges!: Edge[];
        private uf!: UnionFind;
        private index!: number;
        private mstEdges!: Edge[];
        private stepInfo = "";
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
                this.edges = [...graph.edges].sort(
                        (a, b) => (a.weight || 0) - (b.weight || 0)
                );
                this.uf = new UnionFind(graph.nodes.map((node) => node.id));
                this.index = 0;
                this.mstEdges = [];
                this.highlightedNodesSet = new Set<string>();
                this.highlightedEdgesSet = new Set<string>();
                this.state.highlightedNodes = [];
                this.state.highlightedEdges = [];
                this.state.currentNodes = [];
                this.state.currentEdges = [];
                this.stepInfo = "Initialized Kruskal's Algorithm.";
        }

        step(): boolean {
                if (this.index >= this.edges.length) {
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        this.stepInfo = "All edges have been processed.";
                        return false;
                }

                const edge = this.edges[this.index];
                this.index += 1;

                const source = edge.source.id;
                const target = edge.target.id;
                const weightText = edge.weight !== undefined ? edge.weight : 0;
                this.state.currentNodes = [source, target];
                this.state.currentEdges = [edge.id];

                if (!this.uf.connected(source, target)) {
                        this.uf.union(source, target);
                        this.mstEdges.push(edge);
                        this.highlightedEdgesSet.add(edge.id);
                        this.highlightedNodesSet.add(source);
                        this.highlightedNodesSet.add(target);
                        this.state.highlightedEdges = Array.from(this.highlightedEdgesSet);
                        this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                        this.stepInfo = `Added edge ${source}, ${target} with weight ${weightText} to the MST.`;
                } else {
                        this.stepInfo = `Skipped edge ${source}, ${target} with weight ${weightText} to avoid creating a cycle.`;
                        this.state.highlightedNodes = Array.from(this.highlightedNodesSet);
                        this.state.highlightedEdges = Array.from(this.highlightedEdgesSet);
                }

                return true;
        }

        getState(): AlgorithmState {
                return this.state;
        }

        getStepInfo(): string {
                return this.stepInfo;
        }
}
