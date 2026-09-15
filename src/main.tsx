import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';
import './styles/global.css';

const container = document.getElementById('root');
if (container) {
  container.innerHTML = '';
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch(() => {
      // Offline support is a progressive enhancement — the app still runs without it.
    });
  });
}
