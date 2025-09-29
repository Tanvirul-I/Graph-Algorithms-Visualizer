export class DijkstraAlgorithm {
    initialize(graph) {
        this.graph = graph;
        this.state = {
            highlightedNodes: [],
            highlightedEdges: [],
            nodeValues: {},
        };
        this.priorityQueue = [];
        this.distances = new Map();
        this.settledNodes = new Set();
        const startNode = graph.nodes[0];
        this.distances.set(startNode, 0);
        this.priorityQueue.push(startNode);
    }
    step() {
        console.log("test");
        if (this.priorityQueue.length === 0) {
            return false;
        }
        console.log("test2");
        this.priorityQueue.sort((a, b) => (this.distances.get(a) || Infinity) -
            (this.distances.get(b) || Infinity));
        const currentNode = this.priorityQueue.shift();
        this.settledNodes.add(currentNode);
        this.state.highlightedNodes = [currentNode.id];
        const neighbors = this.graph.getNeighbors(currentNode);
        neighbors.forEach(({ node: neighborNode, weight, edge }) => {
            console.log(neighborNode);
            if (!this.settledNodes.has(neighborNode)) {
                const newDist = (this.distances.get(currentNode) || Infinity) + weight;
                if (newDist < (this.distances.get(neighborNode) || Infinity)) {
                    this.distances.set(neighborNode, newDist);
                    this.priorityQueue.push(neighborNode);
                    this.state.highlightedEdges.push(edge.id);
                    this.state.nodeValues[neighborNode.id] = newDist;
                }
            }
        });
        return true;
    }
    getState() {
        return this.state;
    }
}
