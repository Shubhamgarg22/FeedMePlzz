import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { UtensilsCrossed, ClipboardList, User } from "lucide-react";
import { store } from "./store";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setUser, setLoading, logout } from "./store/slices/authSlice";
import { auth } from "./config/firebase";
import api from "./services/api";

import HomeScreen from "./components/screen/home";
import MyClaimsScreen from "./components/screen/claimHistory";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Profile from "./pages/Profile";

// Bottom Navigation
const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: UtensilsCrossed, label: "Browse Food" },
    { path: "/my-claims", icon: ClipboardList, label: "My Claims" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl transition-colors ${
                isActive
                  ? "text-orange-600 bg-orange-50"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[11px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Auth State Listener
const AuthListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    // Check if auth is properly initialized
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
            dispatch(logout());
          }
        } else {
          dispatch(logout());
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

  // Show loading while initializing
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

// App Layout with Bottom Nav
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
};

// Main App Routes
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

      <Route path="/" element={<ProtectedRoute><AppLayout><HomeScreen /></AppLayout></ProtectedRoute>} />
      <Route path="/my-claims" element={<ProtectedRoute><AppLayout><MyClaimsScreen /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AuthListener>
          <AppRoutes />
        </AuthListener>
      </Router>
    </Provider>
  );
};

export default App;
