import axios from "axios";
import { auth } from "../config/firebase";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data: any) => api.put("/auth/profile", data),
};

// Donations API - Receiver focused
export const donationsAPI = {
  getAvailable: (params?: any) => api.get("/donations/available", { params }),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get("/donations/nearby", { params: { lat, lng, radius } }),
  getById: (id: string) => api.get(`/donations/${id}`),
};

// Requests API - Receiver actions
export const requestsAPI = {
  accept: (donationId: string, data?: any) =>
    api.post(`/requests/${donationId}/accept`, data),
  updateStatus: (requestId: string, status: string, data?: any) =>
    api.put(`/requests/${requestId}/status`, { status, ...data }),
  updateLocation: (requestId: string, lat: number, lng: number) =>
    api.put(`/requests/${requestId}/location`, { lat, lng }),
  getMyRequests: (params?: any) => api.get("/requests/my-requests", { params }),
  getById: (id: string) => api.get(`/requests/${id}`),
  addRating: (requestId: string, rating: number, feedback?: string) =>
    api.post(`/requests/${requestId}/rating`, { rating, feedback }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;
