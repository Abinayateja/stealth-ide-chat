import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ✅ ADD THIS
import { registerSW } from 'virtual:pwa-register';

ReactDOM.createRoot(document.getElementById("root")).render(
    <App />
);

// ✅ ADD THIS
registerSW();