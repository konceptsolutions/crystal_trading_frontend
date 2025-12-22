import axios from 'axios';

// API URL configuration - use Next.js API routes
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || '/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Only access localStorage on client side
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Track if we've already logged connection errors to avoid spam
let connectionErrorLogged = false;
let lastConnectionErrorTime = 0;
const CONNECTION_ERROR_THROTTLE = 5000; // Only log once every 5 seconds

// Handle auth errors
api.interceptors.response.use(
  (response) => {
    // Reset error tracking on successful connection
    connectionErrorLogged = false;
    return response;
  },
  (error) => {
    const now = Date.now();
    const shouldLog = !connectionErrorLogged || (now - lastConnectionErrorTime) > CONNECTION_ERROR_THROTTLE;
    
    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || 
        error.code === 'ERR_CONNECTION_REFUSED' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      if (shouldLog) {
        console.error('⚠️ API request failed. Please check if the server is running.');
        connectionErrorLogged = true;
        lastConnectionErrorTime = now;
      }
      return Promise.reject(new Error('Backend server is not running. Please start it first.'));
    }
    
    if (error.response?.status === 401) {
      // Only access localStorage and window on client side
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        // If we get a 401, the token is either missing or invalid/expired
        // Clear it and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          // Use a small delay to prevent redirect loops
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

