import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import './i18n';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false },
    },
});

// Apply dark mode from localStorage on load
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: { borderRadius: '12px', background: '#1f2937', color: '#f9fafb', fontSize: '14px' },
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
);
