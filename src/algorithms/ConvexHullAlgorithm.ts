import { Algorithm, AlgorithmState } from "./Algorithm";
import { Graph } from "../models/Graph";
import { Node } from "../models/Node";

export class ConvexHullAlgorithm implements Algorithm {
        private graph!: Graph;
        private state!: AlgorithmState;
        private sortedNodes: Node[] = [];
        private lowerHull: Node[] = [];
        private upperHull: Node[] = [];
        private lowerIndex = 0;
        private upperIndex = 0;
        private phase: "lower" | "upper" | "finalized" = "lower";
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
                this.sortedNodes = [...graph.nodes].sort((a, b) => {
                        if (a.x === b.x) {
                                return a.y - b.y;
                        }
                        return a.x - b.x;
                });
                this.lowerHull = [];
                this.upperHull = [];
                this.lowerIndex = 0;
                this.upperIndex = this.sortedNodes.length - 1;
                this.phase = "lower";
                this.stepInfo = "Initialized convex hull construction.";

                if (this.sortedNodes.length === 0) {
                        this.stepInfo = "Graph has no nodes to construct a convex hull.";
                        this.phase = "finalized";
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        return;
                }

                if (this.sortedNodes.length === 1) {
                        const node = this.sortedNodes[0];
                        this.state.highlightedNodes = [node.id];
                        this.state.nodeValues[node.id] = 1;
                        this.state.currentNodes = [node.id];
                        this.state.currentEdges = [];
                        this.stepInfo = `Convex hull is a single node (${node.id}).`;
                        this.phase = "finalized";
                        return;
                }

                if (this.sortedNodes.length === 2) {
                        const [first, second] = this.sortedNodes;
                        this.state.highlightedNodes = [first.id, second.id];
                        this.state.nodeValues[first.id] = 1;
                        this.state.nodeValues[second.id] = 2;
                        this.state.highlightedEdges = this.findExistingEdgesInSequence([
                                first,
                                second,
                        ]);
                        this.state.currentNodes = [first.id, second.id];
                        this.state.currentEdges = [...this.state.highlightedEdges];
                        this.stepInfo = `Convex hull is the segment between ${first.id} and ${second.id}.`;
                        this.phase = "finalized";
                }
        }

        step(): boolean {
                if (this.phase === "finalized") {
                        this.state.currentNodes = [];
                        this.state.currentEdges = [];
                        return false;
                }

                if (this.phase === "lower") {
                        if (this.lowerIndex >= this.sortedNodes.length) {
                                this.phase = "upper";
                                this.stepInfo = "Lower hull completed. Starting upper hull.";
                                this.syncHighlightedNodes();
                                this.state.currentNodes = [];
                                this.state.currentEdges = [];
                                return true;
                        }

                        const node = this.sortedNodes[this.lowerIndex];
                        this.lowerIndex += 1;
                        this.lowerHull.push(node);

                        const removedNodes: Node[] = [];
                        while (
                                this.lowerHull.length >= 3 &&
                                !this.isCounterClockwise(
                                        this.lowerHull[this.lowerHull.length - 3],
                                        this.lowerHull[this.lowerHull.length - 2],
                                        this.lowerHull[this.lowerHull.length - 1]
                                )
                        ) {
                                const removed = this.lowerHull.splice(this.lowerHull.length - 2, 1)[0];
                                removedNodes.push(removed);
                        }

                        this.syncHighlightedNodes();
                        const recentLower = this.lowerHull
                                .slice(Math.max(0, this.lowerHull.length - 3))
                                .map((candidate) => candidate.id);
                        const removedLower = removedNodes.map((candidate) => candidate.id);
                        const combinedLower = [...recentLower, ...removedLower];
                        this.state.currentNodes =
                                combinedLower.length > 0
                                        ? Array.from(new Set(combinedLower))
                                        : [node.id];
                        const lowerSegment =
                                this.lowerHull.length >= 2
                                        ? this.lowerHull.slice(this.lowerHull.length - 2)
                                        : this.lowerHull.slice();
                        this.state.currentEdges = this.findExistingEdgesInSequence(lowerSegment);
                        this.stepInfo = `Processing node ${node.id} for the lower hull.`;
                        if (removedNodes.length > 0) {
                                const removedLabels = removedNodes.map((candidate) => candidate.id).join(", ");
                                this.stepInfo += `<br>Removed node(s) ${removedLabels} due to a non-counter-clockwise turn.`;
                        }
                        this.state.nodeValues = {};
                        return true;
                }

                if (this.phase === "upper") {
                        if (this.upperIndex < 0) {
                                this.finalizeHull();
                                return false;
                        }

                        const node = this.sortedNodes[this.upperIndex];
                        this.upperIndex -= 1;
                        this.upperHull.push(node);

                        const removedNodes: Node[] = [];
                        while (
                                this.upperHull.length >= 3 &&
                                !this.isCounterClockwise(
                                        this.upperHull[this.upperHull.length - 3],
                                        this.upperHull[this.upperHull.length - 2],
                                        this.upperHull[this.upperHull.length - 1]
                                )
                        ) {
                                const removed = this.upperHull.splice(this.upperHull.length - 2, 1)[0];
                                removedNodes.push(removed);
                        }

                        this.syncHighlightedNodes();
                        const recentUpper = this.upperHull
                                .slice(Math.max(0, this.upperHull.length - 3))
                                .map((candidate) => candidate.id);
                        const removedUpper = removedNodes.map((candidate) => candidate.id);
                        const combinedUpper = [...recentUpper, ...removedUpper];
                        this.state.currentNodes =
                                combinedUpper.length > 0
                                        ? Array.from(new Set(combinedUpper))
                                        : [node.id];
                        const upperSegment =
                                this.upperHull.length >= 2
                                        ? this.upperHull.slice(this.upperHull.length - 2)
                                        : this.upperHull.slice();
                        this.state.currentEdges = this.findExistingEdgesInSequence(upperSegment);
                        this.stepInfo = `Processing node ${node.id} for the upper hull.`;
                        if (removedNodes.length > 0) {
                                const removedLabels = removedNodes.map((candidate) => candidate.id).join(", ");
                                this.stepInfo += `<br>Removed node(s) ${removedLabels} due to a non-counter-clockwise turn.`;
                        }

                        if (this.upperIndex < 0) {
                                this.finalizeHull();
                                return false;
                        }

                        this.state.nodeValues = {};
                        return true;
                }

                return false;
        }

        getState(): AlgorithmState {
                return this.state;
        }

        getStepInfo(): string {
                return this.stepInfo;
        }

        private finalizeHull() {
                const rawHull = [
                        ...this.lowerHull,
                        ...this.upperHull.slice(1, this.upperHull.length - 1),
                ];

                const orderedHull: Node[] = [];
                const seen = new Set<string>();
                rawHull.forEach((node) => {
                        if (!seen.has(node.id)) {
                                orderedHull.push(node);
                                seen.add(node.id);
                        }
                });

                this.state.highlightedNodes = orderedHull.map((node) => node.id);
                this.state.highlightedEdges = this.findExistingEdgesInSequence(orderedHull);
                this.state.currentNodes = [...this.state.highlightedNodes];
                this.state.currentEdges = [...this.state.highlightedEdges];
                this.state.nodeValues = {};
                orderedHull.forEach((node, index) => {
                        this.state.nodeValues[node.id] = index + 1;
                });

                if (orderedHull.length === 0) {
                        this.stepInfo = "Unable to construct convex hull due to insufficient unique nodes.";
                } else {
                        const labelList = orderedHull.map((node) => node.id).join(" → ");
                        this.stepInfo = `Convex hull completed with vertex order: ${labelList}.`;
                }

                this.phase = "finalized";
        }

        private syncHighlightedNodes() {
                const highlighted = new Set<string>();
                this.lowerHull.forEach((node) => highlighted.add(node.id));
                this.upperHull.forEach((node) => highlighted.add(node.id));
                this.state.highlightedNodes = Array.from(highlighted);
                this.state.highlightedEdges = [];
        }

        private isCounterClockwise(origin: Node, first: Node, second: Node): boolean {
                        return (
                                (first.x - origin.x) * (second.y - origin.y) -
                                (first.y - origin.y) * (second.x - origin.x)
                        ) > 0;
        }

        private findExistingEdgesInSequence(sequence: Node[]): string[] {
                if (sequence.length < 2) {
                        return [];
                }

                const edgeIds: string[] = [];
                const total = sequence.length;
                for (let index = 0; index < total; index += 1) {
                        const current = sequence[index];
                        const next = sequence[(index + 1) % total];
                        if (current.id === next.id) {
                                continue;
                        }
                        const edge = this.graph.edges.find((candidate) => {
                                return (
                                        (candidate.source.id === current.id && candidate.target.id === next.id) ||
                                        (!this.graph.directed &&
                                                candidate.source.id === next.id &&
                                                candidate.target.id === current.id)
                                );
                        });
                        if (edge) {
                                edgeIds.push(edge.id);
                        }
                }

                return edgeIds;
        }
}
