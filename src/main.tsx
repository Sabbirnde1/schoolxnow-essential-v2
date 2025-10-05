import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add better error handling for root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ ERROR: Root element with id 'root' not found in the document!");
  
  // Create a root element if it doesn't exist
  const fallbackRoot = document.createElement("div");
  fallbackRoot.id = "root";
  document.body.appendChild(fallbackRoot);
  
  // Add visible error message to the page
  fallbackRoot.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
      <h2>React Mount Error</h2>
      <p>Could not find the root element to mount the React application.</p>
      <p>This might be caused by:</p>
      <ul>
        <li>Missing or incorrect ID in index.html</li>
        <li>HTML loading issues</li>
        <li>JavaScript loading errors</li>
      </ul>
      <p>Please check the browser console for more details.</p>
    </div>
  `;
  
  // Use the fallback element
  createRoot(fallbackRoot).render(<App />);
} else {
  // Normal initialization
  console.log("✅ Found root element, mounting React app...");
  createRoot(rootElement).render(<App />);
}

// Log successful initialization
console.log("🚀 React initialization attempted");
