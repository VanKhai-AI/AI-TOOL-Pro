import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToolStateProvider } from './contexts/ToolStateContext';
import { APIKeyProvider } from './contexts/APIKeyContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <APIKeyProvider>
        <ToolStateProvider>
          <App />
        </ToolStateProvider>
      </APIKeyProvider>
    </ThemeProvider>
  </React.StrictMode>
);