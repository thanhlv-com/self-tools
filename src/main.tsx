import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";

// Polyfill for Node.js APIs in browser
if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis;
}

if (typeof process === 'undefined') {
  (globalThis as any).process = {
    env: {},
    stdout: {
      write: () => {}
    }
  };
}

createRoot(document.getElementById("root")!).render(<App />);
