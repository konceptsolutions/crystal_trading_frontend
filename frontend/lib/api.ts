import axios from "axios";

// Old localhost URL (commented out for production)
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Vercel backend URL
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://crystal-trading-frontend-piom.vercel.app/api";

// Log API URL for debugging (only in development)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 API URL:", API_URL);
}

// Suppress browser extension errors in console
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      args[0]?.toString().includes("runtime.lastError") ||
      args[0]?.toString().includes("Receiving end does not exist")
    ) {
      // Suppress browser extension errors
      return;
    }
    originalError.apply(console, args);
  };
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
    const shouldLog =
      !connectionErrorLogged ||
      now - lastConnectionErrorTime > CONNECTION_ERROR_THROTTLE;

    // Handle network errors
    if (
      error.code === "ECONNABORTED" ||
      error.message === "Network Error" ||
      error.code === "ERR_CONNECTION_REFUSED" ||
      error.message?.includes("ERR_CONNECTION_REFUSED")
    ) {
      if (shouldLog) {
        console.error(
          "⚠️ Backend server is not running. Please start it using: npm run dev (in backend folder)"
        );
        connectionErrorLogged = true;
        lastConnectionErrorTime = now;
      }
      return Promise.reject(
        new Error("Backend server is not running. Please start it first.")
      );
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
