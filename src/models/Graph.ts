import { Node } from "./Node";
import { Edge } from "./Edge";

export interface SerializedNode {
        id: string;
        label?: string;
        x: number;
        y: number;
}

export interface SerializedEdge {
        id: string;
        source: string;
        target: string;
        weight?: number;
}

export interface SerializedGraph {
        directed: boolean;
        nodes: SerializedNode[];
        edges: SerializedEdge[];
}

export class Graph {
        nodes: Node[];
        edges: Edge[];
        directed: boolean;

        constructor(
                nodes: Node[] = [],
                edges: Edge[] = [],
                directed: boolean = false
        ) {
                this.nodes = nodes;
                this.edges = edges;
                this.directed = directed;
        }

        static fromSerialized(data: SerializedGraph): Graph {
                const nodes: Node[] = data.nodes.map((node) => ({ ...node }));
                const nodeMap = new Map(nodes.map((node) => [node.id, node]));
                const edges: Edge[] = data.edges.map((edge) => {
                        const source = nodeMap.get(edge.source);
                        const target = nodeMap.get(edge.target);
                        if (!source || !target) {
                                throw new Error("Invalid edge references in serialized graph.");
                        }
                        return {
                                id: edge.id,
                                source,
                                target,
                                weight: edge.weight,
                        };
                });

                return new Graph(nodes, edges, data.directed);
        }

        toSerialized(): SerializedGraph {
                return {
                        directed: this.directed,
                        nodes: this.nodes.map((node) => ({
                                id: node.id,
                                label: node.label,
                                x: node.x,
                                y: node.y,
                        })),
                        edges: this.edges.map((edge) => ({
                                id: edge.id,
                                source: edge.source.id,
                                target: edge.target.id,
                                weight: edge.weight,
                        })),
                };
        }

        clone(
                overrides: Partial<{
                        nodes: Node[];
                        edges: Edge[];
                        directed: boolean;
                }> = {}
        ): Graph {
                const nodes = overrides.nodes
                        ? overrides.nodes.map((node) => ({ ...node }))
                        : this.nodes.map((node) => ({ ...node }));

                const nodeMap = new Map(nodes.map((node) => [node.id, node]));

                const edges = (overrides.edges ?? this.edges).map((edge) => {
                        const source = nodeMap.get(edge.source.id);
                        const target = nodeMap.get(edge.target.id);
                        if (!source || !target) {
                                throw new Error("Unable to resolve nodes while cloning graph.");
                        }
                        return {
                                ...edge,
                                source,
                                target,
                        };
                });

                const directed = overrides.directed ?? this.directed;

                return new Graph(nodes, edges, directed);
        }

        getNeighbors(node: Node): Array<{ node: Node; weight: number; edge: Edge }> {
                const neighbors: { node: Node; weight: number; edge: Edge }[] = [];
                this.edges.forEach((edge) => {
                        if (edge.source.id === node.id) {
                                neighbors.push({
                                        node: edge.target,
                                        weight: edge.weight || 1,
                                        edge: edge,
                                });
                        } else if (!this.directed && edge.target.id === node.id) {
                                neighbors.push({
                                        node: edge.source,
                                        weight: edge.weight || 1,
                                        edge: edge,
                                });
                        }
                });
                return neighbors;
        }

        getNodeById(nodeId: string): Node | undefined {
                return this.nodes.find((node) => node.id === nodeId);
        }
}
