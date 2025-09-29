import React from "react";
const Controls = ({ onNextStep, onReset }) => {
    return (React.createElement("div", null,
        React.createElement("button", { onClick: onNextStep }, "Next Step"),
        React.createElement("button", { onClick: onReset }, "Reset")));
};
export default Controls;
