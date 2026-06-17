import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PostHogProvider } from '@posthog/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FeatureProvider } from './context/FeatureContext';
import './index.css';

const posthogOptions = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-01-30',
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_PROJECT_TOKEN}
      options={posthogOptions}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <FeatureProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </FeatureProvider>
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
);
