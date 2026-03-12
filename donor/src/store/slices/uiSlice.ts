import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

interface UIState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  toasts: Toast[];
  modals: Record<string, Modal>;
  isLoading: boolean;
  globalError: string | null;
  currentLocation: { lat: number; lng: number } | null;
}

const initialState: UIState = {
  theme: (localStorage.getItem("theme") as UIState["theme"]) || "system",
  sidebarOpen: true,
  toasts: [],
  modals: {},
  isLoading: false,
  globalError: null,
  currentLocation: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<UIState["theme"]>) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    openModal: (state, action: PayloadAction<{ id: string; data?: any }>) => {
      state.modals[action.payload.id] = {
        id: action.payload.id,
        isOpen: true,
        data: action.payload.data,
      };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      if (state.modals[action.payload]) {
        state.modals[action.payload].isOpen = false;
      }
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
    setCurrentLocation: (
      state,
      action: PayloadAction<{ lat: number; lng: number } | null>
    ) => {
      state.currentLocation = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  clearToasts,
  openModal,
  closeModal,
  setGlobalLoading,
  setGlobalError,
  setCurrentLocation,
} = uiSlice.actions;

export default uiSlice.reducer;
