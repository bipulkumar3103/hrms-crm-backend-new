
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

// Add a request interceptor to include the token from localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
    // console.log(`[API Request] Token found & attached for ${config.url}`);
  } else {
    console.warn(`[API Request] NO TOKEN found for ${config.url}`);
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add a response interceptor to handle errors globally 
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    console.error("[API Response] 401 Unauthorized - Token may be invalid or expired.", error.config.url);
  }
  return Promise.reject(error);
});

export { api };
