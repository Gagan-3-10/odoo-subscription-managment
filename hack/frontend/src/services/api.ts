import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brightloop_token');
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
    if (error.response?.status === 401) {
      // Clear token and redirect to login if session expired
      if (window.location.pathname !== '/') {
        localStorage.removeItem('brightloop_token');
        localStorage.removeItem('brightloop_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
