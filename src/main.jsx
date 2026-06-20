import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ABOS is dark-navy + gold globally. Force the dark theme on permanently.
document.documentElement.classList.add('dark');
try { localStorage.setItem('abos-theme', 'dark'); } catch (_) {}

// Unregister any stale service workers that may serve cached/mismatched React bundles
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  });
  // Also clear caches to prevent stale JS from being served
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)