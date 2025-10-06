import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from '#src/App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
