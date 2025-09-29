export class Graph {
    constructor(nodes = [], edges = []) {
        this.nodes = nodes;
        this.edges = edges;
    }
    getNeighbors(node) {
        const neighbors = [];
        this.edges.forEach((edge) => {
            if (edge.source.id === node.id) {
                neighbors.push({
                    node: edge.target,
                    weight: edge.weight || 1,
                    edge: edge,
                });
            }
        });
        return neighbors;
    }
    getNodeById(nodeId) {
        return this.nodes.find((node) => node.id === nodeId);
    }
}
