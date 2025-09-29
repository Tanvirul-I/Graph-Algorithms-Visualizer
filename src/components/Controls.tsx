import React from "react";

interface ControlsProps {
        currentStep: number;
        totalSteps: number;
        onFirstStep: () => void;
        onPreviousStep: () => void;
        onNextStep: () => void;
        onLastStep: () => void;
        onReset: () => void;
        onStepChange: (step: number) => void;
        disableFirst: boolean;
        disablePrevious: boolean;
        disableNext: boolean;
        disableLast: boolean;
        disableReset: boolean;
        disableSlider: boolean;
}

const Controls: React.FC<ControlsProps> = ({
        currentStep,
        totalSteps,
        onFirstStep,
        onPreviousStep,
        onNextStep,
        onLastStep,
        onReset,
        onStepChange,
        disableFirst,
        disablePrevious,
        disableNext,
        disableLast,
        disableReset,
        disableSlider,
}) => {
        const sliderMax = Math.max(totalSteps - 1, 0);
        const sliderValue = totalSteps > 0 ? currentStep : 0;
        const stepLabel =
                totalSteps > 0
                        ? `Step ${currentStep + 1} of ${totalSteps}`
                        : "No steps recorded yet.";

        return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                <button onClick={onFirstStep} disabled={disableFirst}>
                                        « First
                                </button>
                                <button onClick={onPreviousStep} disabled={disablePrevious}>
                                        ‹ Prev
                                </button>
                                <button onClick={onNextStep} disabled={disableNext}>
                                        Next ›
                                </button>
                                <button onClick={onLastStep} disabled={disableLast}>
                                        Last »
                                </button>
                                <button onClick={onReset} disabled={disableReset}>
                                        Reset
                                </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontWeight: 600 }}>{stepLabel}</label>
                                <input
                                        type="range"
                                        min={0}
                                        max={sliderMax}
                                        value={sliderValue}
                                        onChange={(event) => onStepChange(Number(event.target.value))}
                                        disabled={disableSlider}
                                        style={{ width: "100%" }}
                                />
                        </div>
                </div>
        );
};

export default Controls;
