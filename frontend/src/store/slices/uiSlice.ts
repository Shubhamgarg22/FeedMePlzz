import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppDispatch } from "../index";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

interface UIState {
  theme: "light" | "dark";
  isSidebarOpen: boolean;
  isBottomSheetOpen: boolean;
  toasts: Toast[];
  isLoading: boolean;
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
}

const initialState: UIState = {
  theme: "light",
  isSidebarOpen: false,
  isBottomSheetOpen: false,
  toasts: [],
  isLoading: false,
  currentLocation: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleBottomSheet: (state) => {
      state.isBottomSheetOpen = !state.isBottomSheetOpen;
    },
    setBottomSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isBottomSheetOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentLocation: (
      state,
      action: PayloadAction<{ lat: number; lng: number } | null>
    ) => {
      state.currentLocation = action.payload;
    },
  },
});

// Thunk that adds a toast and auto-removes it after 5 seconds
export const showToast =
  (toast: Omit<Toast, "id">) => (dispatch: AppDispatch) => {
    dispatch(uiSlice.actions.addToast(toast));
    const id = Date.now().toString();
    setTimeout(() => {
      dispatch(uiSlice.actions.removeToast(id));
    }, 5000);
  };

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleBottomSheet,
  setBottomSheetOpen,
  addToast,
  removeToast,
  setLoading,
  setCurrentLocation,
} = uiSlice.actions;

export default uiSlice.reducer;

