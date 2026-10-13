import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for responses
apiClient.interceptors.response.use(
  (response) => {
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!DOCTYPE') ||
        response.data.trim().startsWith('<html') ||
        response.data.trim().startsWith('<!doctype'))
    ) {
      const err = new Error(
        'Backend API not connected! Please set VITE_API_URL in your Render Frontend Environment Variables pointing to your Render Backend URL and redeploy.'
      );
      err.status = 502;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
