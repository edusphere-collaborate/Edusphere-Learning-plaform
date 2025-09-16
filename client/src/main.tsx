import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress development warnings in console
if (process.env.NODE_ENV === 'development') {
  // Override console methods to filter out SES lockdown warnings
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('SES') ||
      message.includes('lockdown') ||
      message.includes('intrinsics') ||
      message.includes('Removing unpermitted') ||
      message.includes('Source map error') ||
      message.includes('No sources are declared') ||
      message.includes('clsx.js.map') ||
      message.includes('@radix-ui') ||
      message.includes('react_devtools_backend')
    ) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('spoofer.js') ||
      message.includes('An unexpected error occurred') ||
      message.includes('Source map error') ||
      message.includes('No sources are declared') ||
      message.includes('clsx.js.map') ||
      message.includes('@radix-ui') ||
      message.includes('react_devtools_backend') ||
      message.includes("can't access property \"sources\"")
    ) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
