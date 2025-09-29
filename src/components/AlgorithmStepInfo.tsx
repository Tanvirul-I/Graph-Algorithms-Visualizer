import React from "react";
import { AlgorithmStepRecord } from "../algorithms/Algorithm";

interface AlgorithmStepInfoProps {
        steps: AlgorithmStepRecord[];
        currentStepIndex: number;
        onSelectStep: (stepIndex: number) => void;
}

const highlightLine = (
        line: string,
        currentNodes: string[],
        highlightedNodes: string[],
        keyPrefix: string
) => {
        if (!line) {
                return <span>{line}</span>;
        }

        const nodeColors = new Map<string, string>();
        currentNodes.forEach((node) => {
                nodeColors.set(node, "#2e7d32");
        });
        highlightedNodes.forEach((node) => {
                if (!nodeColors.has(node)) {
                        nodeColors.set(node, "#c62828");
                }
        });

        if (nodeColors.size === 0) {
                return <span>{line}</span>;
        }

        const escapedNodes = Array.from(nodeColors.keys())
                .map((node) => node.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                .join("|");
        if (!escapedNodes) {
                return <span>{line}</span>;
        }

        const pattern = new RegExp(`\\b(?:${escapedNodes})\\b`, "g");
        const children: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
                const [matchedText] = match;
                const start = match.index;
                if (start > lastIndex) {
                        const segment = line.slice(lastIndex, start);
                        children.push(
                                <span key={`${keyPrefix}-text-${start}`}>{segment}</span>
                        );
                }
                const color = nodeColors.get(matchedText) ?? "#c62828";
                children.push(
                        <span
                                key={`${keyPrefix}-node-${start}`}
                                style={{ color, fontWeight: 600 }}
                        >
                                {matchedText}
                        </span>
                );
                lastIndex = start + matchedText.length;
        }

        if (lastIndex < line.length) {
                children.push(
                        <span key={`${keyPrefix}-text-end`}>
                                {line.slice(lastIndex)}
                        </span>
                );
        }

        return <React.Fragment>{children}</React.Fragment>;
};

const AlgorithmStepInfo: React.FC<AlgorithmStepInfoProps> = ({
        steps,
        currentStepIndex,
        onSelectStep,
}) => {
        return (
                <div>
                        <h2>Algorithm Steps</h2>
                        {steps.length === 0 ? (
                                <p>No steps recorded yet. Select an algorithm to begin.</p>
                        ) : (
                                <ol
                                        style={{
                                                paddingLeft: "20px",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "12px",
                                                margin: 0,
                                        }}
                                >
                                        {steps.map((step, index) => {
                                                const lines = step.description
                                                        .split("<br>")
                                                        .map((line) => line.trim())
                                                        .filter((line) => line.length > 0);
                                                const isActive = index === currentStepIndex;
                                                return (
                                                        <li
                                                                key={index}
                                                                style={{
                                                                        listStyle: "none",
                                                                        padding: "12px",
                                                                        borderRadius: "8px",
                                                                        border: "1px solid #d3d8de",
                                                                        backgroundColor: isActive
                                                                                ? "#eaf1ff"
                                                                                : "#ffffff",
                                                                        boxShadow: isActive
                                                                                ? "0 2px 6px rgba(15, 23, 42, 0.1)"
                                                                                : "none",
                                                                        transition: "background-color 0.2s ease",
                                                                }}
                                                        >
                                                                <div
                                                                        style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "space-between",
                                                                                marginBottom: "8px",
                                                                        }}
                                                                >
                                                                        <span style={{ fontWeight: 600 }}>
                                                                                Step {index + 1}
                                                                        </span>
                                                                        <button
                                                                                onClick={() => onSelectStep(index)}
                                                                                disabled={isActive}
                                                                                style={{
                                                                                        padding: "4px 10px",
                                                                                        border: "1px solid #c4cbd6",
                                                                                        borderRadius: "4px",
                                                                                        backgroundColor: isActive
                                                                                                ? "#dce5f5"
                                                                                                : "#ffffff",
                                                                                        cursor: isActive
                                                                                                ? "default"
                                                                                                : "pointer",
                                                                                }}
                                                                        >
                                                                                {isActive ? "Current" : "View"}
                                                                        </button>
                                                                </div>
                                                                {lines.length === 0 ? (
                                                                        <p
                                                                                style={{
                                                                                        margin: 0,
                                                                                        color: "#52606d",
                                                                                }}
                                                                        >
                                                                                No additional details recorded for this
                                                                                step.
                                                                        </p>
                                                                ) : (
                                                                        <ul
                                                                                style={{
                                                                                        paddingLeft: "20px",
                                                                                        margin: 0,
                                                                                        display: "flex",
                                                                                        flexDirection: "column",
                                                                                        gap: "4px",
                                                                                }}
                                                                        >
                                                                                {lines.map((line, lineIndex) => (
                                                                                        <li
                                                                                                key={`${index}-${lineIndex}`}
                                                                                                style={{
                                                                                                        color: "#1f2933",
                                                                                                }}
                                                                                        >
                                                                                                {highlightLine(
                                                                                                        line,
                                                                                                        step.state
                                                                                                                .currentNodes,
                                                                                                        step.state
                                                                                                                .highlightedNodes,
                                                                                                        `${index}-${lineIndex}`
                                                                                                )}
                                                                                        </li>
                                                                                ))}
                                                                        </ul>
                                                                )}
                                                        </li>
                                                );
                                        })}
                                </ol>
                        )}
                </div>
        );
};

export default AlgorithmStepInfo;
