import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token but don't redirect
      // AuthListener handles redirects via ProtectedRoute
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    firebaseToken: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    organizationName?: string;
    organizationType?: string;
  }) => api.post("/auth/register", data),

  login: (firebaseToken: string) => api.post("/auth/login", { firebaseToken }),

  getProfile: () => api.get("/auth/me"),

  updateProfile: (data: {
    name?: string;
    phone?: string;
    organizationName?: string;
    organizationType?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      coordinates?: { lat: number; lng: number };
    };
    profileImage?: string;
  }) => api.put("/auth/profile", data),
};

// Donations API
export const donationsAPI = {
  getAll: (params?: {
    status?: string;
    foodType?: string;
    search?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }) => api.get("/donations", { params }),

  getMy: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get("/donations/my", { params }),

  getById: (id: string) => api.get(`/donations/${id}`),

  create: (data: {
    foodType: string;
    foodName: string;
    description?: string;
    quantity: number;
    quantityUnit?: string;
    expiryTime: string;
    pickupLocation: {
      address: string;
      lat: number;
      lng: number;
    };
    imageUrl?: string;
    specialInstructions?: string;
    allergens?: string[];
    isVegetarian?: boolean;
    isVegan?: boolean;
  }) => api.post("/donations", data),

  update: (id: string, data: Partial<Parameters<typeof donationsAPI.create>[0]>) =>
    api.put(`/donations/${id}`, data),

  delete: (id: string) => api.delete(`/donations/${id}`),

  getStats: () => api.get("/donations/stats/summary"),
};

// Requests API
export const requestsAPI = {
  accept: (donationId: string, notes?: string) =>
    api.post("/requests/accept", { donationId, notes }),

  updateStatus: (requestId: string, status: string, data?: {
    cancelReason?: string;
    receiverLocation?: { lat: number; lng: number };
  }) => api.put("/requests/status", { requestId, status, ...data }),

  updateLocation: (id: string, lat: number, lng: number) =>
    api.put(`/requests/${id}/location`, { lat, lng }),

  getMy: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get("/requests/my", { params }),

  getById: (id: string) => api.get(`/requests/${id}`),

  getForDonation: (donationId: string) =>
    api.get(`/requests/donation/${donationId}`),

  rate: (id: string, rating: number, feedback?: string) =>
    api.post(`/requests/${id}/rate`, { rating, feedback }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: { isRead?: boolean; page?: number; limit?: number }) =>
    api.get("/notifications", { params }),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put("/notifications/read-all"),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Admin API
export const adminAPI = {
  getUsers: (params?: {
    role?: string;
    isVerified?: boolean;
    isBlocked?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get("/admin/users", { params }),

  getUser: (id: string) => api.get(`/admin/users/${id}`),

  verifyUser: (id: string) => api.put(`/admin/verify/${id}`),

  blockUser: (id: string, block: boolean, reason?: string) =>
    api.put(`/admin/block/${id}`, { block, reason }),

  getDonations: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get("/admin/donations", { params }),

  getRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get("/admin/requests", { params }),

  getStats: () => api.get("/admin/stats"),

  getLogs: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get("/admin/logs", { params }),
};

export default api;
