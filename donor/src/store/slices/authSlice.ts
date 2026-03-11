import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { authAPI } from "../../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "donor" | "receiver" | "admin";
  isVerified: boolean;
  profileImage?: string;
  organizationName?: string;
  organizationType?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  totalDonations?: number;
  totalPickups?: number;
  rating?: number;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  token: localStorage.getItem("token"),
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Async thunks
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    data: {
      email: string;
      password: string;
      name: string;
      phone: string;
      role: string;
      organizationName?: string;
      organizationType?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      let userCredential;
      
      // Create Firebase user, or sign in if already exists
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
      } catch (firebaseError: any) {
        if (firebaseError.code === "auth/email-already-in-use") {
          // Firebase user exists but MongoDB user may not - sign in instead
          userCredential = await signInWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );
        } else {
          throw firebaseError;
        }
      }
      
      // Get Firebase token
      const firebaseToken = await userCredential.user.getIdToken();
      
      // Register in backend (will create MongoDB user if missing)
      const response = await authAPI.register({
        firebaseToken,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
      });
      
      // Store token
      localStorage.setItem("token", firebaseToken);
      
      return {
        user: response.data.user,
        token: firebaseToken,
        firebaseUser: userCredential.user,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Registration failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    data: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // Get Firebase token
      const firebaseToken = await userCredential.user.getIdToken();
      
      // Login in backend
      const response = await authAPI.login(firebaseToken);
      
      // Store token
      localStorage.setItem("token", firebaseToken);
      
      return {
        user: response.data.user,
        token: firebaseToken,
        firebaseUser: userCredential.user,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No user logged in");
      }
      
      const firebaseToken = await currentUser.getIdToken(true);
      const response = await authAPI.login(firebaseToken);
      
      localStorage.setItem("token", firebaseToken);
      
      return {
        user: response.data.user,
        token: firebaseToken,
        firebaseUser: currentUser,
      };
    } catch (error: any) {
      localStorage.removeItem("token");
      return rejectWithValue(error.message || "Token refresh failed");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    data: Partial<User>,
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.updateProfile(data);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Profile update failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setFirebaseUser: (state, action: PayloadAction<FirebaseUser | null>) => {
      state.firebaseUser = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.firebaseUser = action.payload.firebaseUser;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.firebaseUser = action.payload.firebaseUser;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.firebaseUser = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // Refresh token
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.firebaseUser = action.payload.firebaseUser;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.firebaseUser = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      });
  },
});

export const { setUser, setFirebaseUser, setLoading, clearError } = authSlice.actions;
export default authSlice.reducer;
