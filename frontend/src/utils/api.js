
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

// Add a request interceptor to include the token from localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export { api };
