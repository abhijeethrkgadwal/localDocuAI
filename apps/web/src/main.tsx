import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { detectLocaleFromPath, loadCatalog } from './i18n';
import './index.css';

registerSW({ immediate: true });

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

// The prerendered page stays visible while the locale catalog loads, so localized pages
// never flash English copy on first paint.
void loadCatalog(detectLocaleFromPath(window.location.pathname))
  .catch(() => undefined)
  .then(() => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
