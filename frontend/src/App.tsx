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
import { Home, History, MessageSquare, Brain, User } from "lucide-react";
import { store } from "./store";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setUser, setLoading, logout } from "./store/slices/authSlice";
import { auth } from "./config/firebase";
import api from "./services/api";

// Screens
import HomeScreen from "./components/screen/home";
import ClaimHistory from "./components/screen/claimHistory";
import FeedbackScreen from "./components/screen/feedback";
import AIInsight from "./components/screen/aiinsight";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Profile from "./pages/Profile";

// Bottom Navigation Component
const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/history", icon: History, label: "History" },
    { path: "/feedback", icon: MessageSquare, label: "Feedback" },
    { path: "/insights", icon: Brain, label: "Insights" },
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
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive
                  ? "text-green-600 bg-green-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
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
            dispatch(setUser(response.data));
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
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomeScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClaimHistory />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FeedbackScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AIInsight />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
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
