import React, { useState, useEffect } from "react";
import GraphCanvas from "./components/GraphCanvas";
import Controls from "./components/Controls";
import AlgorithmSelector from "./components/AlgorithmSelector";
import { Graph } from "./models/Graph";
import { DijkstraAlgorithm } from "./algorithms/DijkstraAlgorithm";
const App = () => {
    const [graph, setGraph] = useState(new Graph());
    const [algorithmName, setAlgorithmName] = useState("");
    const [algorithmInstance, setAlgorithmInstance] = useState(null);
    const [algorithmState, setAlgorithmState] = useState({
        highlightedNodes: [],
        highlightedEdges: [],
        nodeValues: {},
    });
    const algorithms = {
        Dijkstra: new DijkstraAlgorithm(),
    };
    useEffect(() => {
        const initialNodes = [
            { id: "A", x: 100, y: 100 },
            { id: "B", x: 300, y: 100 },
            { id: "C", x: 200, y: 300 },
            { id: "D", x: 500, y: 150 },
            { id: "E", x: 350, y: 500 },
            { id: "F", x: 250, y: 750 },
        ];
        const initialEdges = [
            { id: "AB", source: initialNodes[0], target: initialNodes[1], weight: 1 },
            { id: "AC", source: initialNodes[0], target: initialNodes[2], weight: 4 },
            { id: "DC", source: initialNodes[3], target: initialNodes[2], weight: 2 },
            { id: "EF", source: initialNodes[4], target: initialNodes[5], weight: 3 },
            { id: "AF", source: initialNodes[0], target: initialNodes[5], weight: 9 },
            { id: "BF", source: initialNodes[1], target: initialNodes[5], weight: 5 },
            { id: "DE", source: initialNodes[3], target: initialNodes[4], weight: 8 },
        ];
        setGraph(new Graph(initialNodes, initialEdges));
    }, []);
    const handleSelectAlgorithm = (name) => {
        console.log(name);
        setAlgorithmName(name);
        const algorithm = algorithms[name];
        if (algorithm) {
            algorithm.initialize(graph);
            setAlgorithmInstance(algorithm);
            setAlgorithmState(algorithm.getState());
            console.log("test");
        }
    };
    const handleNextStep = () => {
        if (algorithmInstance) {
            console.log(algorithmInstance);
            const hasMoreSteps = algorithmInstance.step();
            setTimeout(() => {
                setAlgorithmState(algorithmInstance.getState());
            }, 100);
            if (!hasMoreSteps) {
                alert("Algorithm has finished executing.");
            }
        }
    };
    const handleReset = () => {
        if (algorithmInstance) {
            algorithmInstance.initialize(graph);
            setAlgorithmState(algorithmInstance.getState());
        }
    };
    return (React.createElement("div", null,
        React.createElement("h1", null, "Graph Algorithm Visualizer"),
        React.createElement(AlgorithmSelector, { algorithms: Object.keys(algorithms), onSelectAlgorithm: handleSelectAlgorithm }),
        React.createElement(Controls, { onNextStep: handleNextStep, onReset: handleReset }),
        React.createElement(GraphCanvas, { graph: graph, algorithmState: algorithmState })));
};
export default App;
