
import axios from 'axios';

export const API_PATH = process.env.REACT_APP_API_PATH || '/api/v1';

const api = axios.create({
  baseURL: API_PATH,
});

// Add a request interceptor to include the token from localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log(`[API OUTBOUND] ${config.method?.toUpperCase()} ${config.url}`, config.data || '(no body)');
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  } else {
    console.warn(`[API AUTH] NO TOKEN found for ${config.url}`);
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add a response interceptor to handle errors globally 
api.interceptors.response.use(response => {
  console.log(`[API INBOUND] ${response.status} ${response.config.url}`, response.data);
  return response;
}, error => {
  console.error(`[API ERROR] ${error.response?.status || 'NETWORK'} ${error.config?.url}`, error.response?.data || error.message);
  if (error.response?.status === 401) {
    console.error("[API Response] 401 Unauthorized - Token may be invalid or expired. Forces re-authentication.");
    localStorage.removeItem('token');
    // Force a full page reload to the root to trigger App.js logic and cleanup states
    window.location.href = '/';
  }
  return Promise.reject(error);
});

export { api };
