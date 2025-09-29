import React from "react";
const AlgorithmSelector = ({ algorithms, onSelectAlgorithm, }) => {
    return (React.createElement("select", { onChange: (e) => onSelectAlgorithm(e.target.value) },
        React.createElement("option", { value: "" }, "Select Algorithm"),
        algorithms.map((name) => (React.createElement("option", { key: name, value: name }, name)))));
};
export default AlgorithmSelector;
