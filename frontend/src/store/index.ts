import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import donationsReducer from "./slices/donationsSlice";
import requestsReducer from "./slices/requestsSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    donations: donationsReducer,
    requests: requestsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
