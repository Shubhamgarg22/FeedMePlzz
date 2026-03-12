import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { store } from "./store";
import { useAppDispatch } from "./store/hooks";
import { useAppSelector } from "./store/hooks";
import { setUser, setLoading } from "./store/slices/authSlice";
import { auth } from "./config/firebase";
import api from "./services/api";
import { Toaster } from "./components/ui/toaster";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import DonationForm from "./pages/DonationForm";
import DonationHistory from "./pages/DonationHistory";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

// Receiver Pages
import BrowseFood from "./pages/receiver/BrowseFood";
import MyClaims from "./pages/receiver/MyClaims";
import ReceiverProfile from "./pages/receiver/ReceiverProfile";

// Styles
import "./App.css";

// Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "receiver") {
    return <Navigate to="/browse" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

// Auth State Listener
const AuthListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      console.warn("Firebase auth not properly initialized, running in demo mode");
      dispatch(setLoading(false));
      setInitialized(true);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            localStorage.setItem("token", token);
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const response = await api.get("/auth/me");
            dispatch(setUser(response.data.user));
          } catch (error) {
            console.error("Error fetching user:", error);
            localStorage.removeItem("token");
            dispatch(setUser(null));
          }
        } else {
          localStorage.removeItem("token");
          dispatch(setUser(null));
        }
        dispatch(setLoading(false));
        setInitialized(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase auth error:", error);
      dispatch(setLoading(false));
      setInitialized(true);
    }
  }, [dispatch]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-green-700">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AuthListener>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes - Donor Only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["donor"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donate"
              element={
                <ProtectedRoute allowedRoles={["donor"]}>
                  <DonationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={["donor"]}>
                  <DonationHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["donor"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={["donor"]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Receiver Only */}
            <Route
              path="/browse"
              element={
                <ProtectedRoute allowedRoles={["receiver"]}>
                  <BrowseFood />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-claims"
              element={
                <ProtectedRoute allowedRoles={["receiver"]}>
                  <MyClaims />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receiver/profile"
              element={
                <ProtectedRoute allowedRoles={["receiver"]}>
                  <ReceiverProfile />
                </ProtectedRoute>
              }
            />

            {/* Default Redirects */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </AnimatePresence>
        <Toaster />
      </BrowserRouter>
      </AuthListener>
    </Provider>
  );
};

export default App;
