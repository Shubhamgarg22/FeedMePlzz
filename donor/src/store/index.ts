import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import donationsReducer from "./slices/donationsSlice";
import requestsReducer from "./slices/requestsSlice";
import uiReducer from "./slices/uiSlice";
import notificationsReducer from "./slices/notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    donations: donationsReducer,
    requests: requestsReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["auth/setUser"],
        // Ignore these paths in the state
        ignoredPaths: ["auth.user"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
