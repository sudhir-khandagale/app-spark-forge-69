import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force service worker update and clear stale caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
