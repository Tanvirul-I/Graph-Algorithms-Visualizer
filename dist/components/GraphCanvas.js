import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
const GraphCanvas = ({ graph, algorithmState }) => {
    const svgRef = useRef(null);
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        const width = 800;
        const height = 600;
        const simulation = d3
            .forceSimulation(graph.nodes)
            .force("link", d3
            .forceLink(graph.edges)
            .id((d) => d.id)
            .distance(100))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));
        const link = svg
            .append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(graph.edges)
            .enter()
            .append("line")
            .attr("stroke-width", 2)
            .attr("stroke", (d) => algorithmState.highlightedEdges.includes(d.id) ? "red" : "#999");
        const node = svg
            .append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(graph.nodes)
            .enter()
            .append("circle")
            .attr("r", 10)
            .attr("fill", (d) => algorithmState.highlightedNodes.includes(d.id) ? "orange" : "steelblue")
            .call(d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
        const label = svg
            .append("g")
            .selectAll("text")
            .data(graph.nodes)
            .enter()
            .append("text")
            .text((d) => algorithmState.nodeValues[d.id] || d.label || d.id)
            .attr("x", 15)
            .attr("y", 5);
        simulation.on("tick", () => {
            link
                .attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);
            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
            label.attr("x", (d) => d.x).attr("y", (d) => d.y);
        });
        function dragstarted(event, d) {
            if (!event.active)
                simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active)
                simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }, [graph, algorithmState]);
    return (React.createElement("svg", { ref: svgRef, width: "800", height: "600" }));
};
export default GraphCanvas;
