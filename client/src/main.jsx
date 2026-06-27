import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FeatureProvider } from './context/FeatureContext';
import './index.css';

// NOTE: PostHog is no longer wired via <PostHogProvider> here. posthog-js (~67 kB
// gzip) was the single largest item in the initial bundle on EVERY page. It is now
// dynamically imported and initialised on first idle by the analytics bus
// (src/services/analytics + AnalyticsBridge), keeping it off the first-paint path.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FeatureProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FeatureProvider>
    </BrowserRouter>
  </React.StrictMode>
);
