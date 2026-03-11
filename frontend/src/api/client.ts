import axios from 'axios';

const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;

    // In production, if VITE_API_URL is missing, log a loud error
    if (import.meta.env.PROD && !envUrl) {
        console.error('🚨 CRITICAL ERROR: VITE_API_URL environment variable is missing! The frontend cannot connect to the backend.');
        // We still return /api/v1 so it doesn't crash immediately, but the requests will fail.
        return '/api/v1';
    }

    if (!envUrl) return '/api/v1';
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
};

const baseURL = getBaseUrl();

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                });

                const { accessToken, refreshToken: newRefresh } = response.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefresh);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

export default api;
