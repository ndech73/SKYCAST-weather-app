import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { SettingsProvider } from "./context/settingsContext.jsx";
import "./styles/pages/theme-styles.css";
import "./index.css";
import "./styles/pages/home.css";
import "./styles/pages/mobile-redesign.css";

// ✅ Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/ServiceWorker.js')
      .then(reg => {
        console.log('✅ Service Worker registered:', reg.scope)
      })
      .catch(err => {
        console.error('❌ Service Worker registration failed:', err)
      })
  })
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
);