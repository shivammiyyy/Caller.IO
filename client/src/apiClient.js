// src/utils/axios.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create an instance of Axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // This ensures cookies are sent with requests
});

// Optionally, you can add request and response interceptors
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');       // or: get it from your React state
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally here
    return Promise.reject(error);
  }
);

export default apiClient;