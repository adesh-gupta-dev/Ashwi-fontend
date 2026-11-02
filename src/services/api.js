import axios from 'axios';

function normalizeBaseUrl(value, fallback) {
  const raw = typeof value === 'string' ? value.trim() : '';

  if (!raw) {
    return fallback;
  }

  const withoutTrailingSlash = raw.replace(/\/$/, '');

  if (/^https?:\/\//i.test(withoutTrailingSlash) || withoutTrailingSlash.startsWith('/')) {
    return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
  }

  return fallback;
}

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

const authHandlers = {
  onUnauthorized: null,
};

export const registerAuthHandlers = ({ onUnauthorized }) => {
  authHandlers.onUnauthorized = onUnauthorized;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const skipRedirect = error.config?.skipAuthRedirect;
      if (!skipRedirect) {
        authHandlers.onUnauthorized?.();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
