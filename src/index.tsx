import React from "react";
import ReactDOM from "react-dom/client"; // This is the correct import for React 18;
import App from "./App";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container!); // Use ! to assert that 'container' is non-null
root.render(<App />);
