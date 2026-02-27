import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { donationsAPI } from "../../services/api";

export interface Donation {
  _id: string;
  donorId: {
    _id: string;
    name: string;
    organizationName?: string;
    rating?: number;
    profileImage?: string;
  } | string;
  foodType: string;
  foodName: string;
  description?: string;
  quantity: number;
  quantityUnit: string;
  expiryTime: string;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  pickupStartTime: string;
  pickupEndTime: string;
  imageUrl?: string;
  status: "available" | "accepted" | "picked_up" | "delivered" | "cancelled" | "expired";
  specialInstructions?: string;
  allergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DonationStats {
  totalDonations: number;
  availableDonations: number;
  completedDonations: number;
  totalQuantity: number;
}

interface DonationsState {
  donations: Donation[];
  myDonations: Donation[];
  selectedDonation: Donation | null;
  stats: DonationStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
  filters: {
    status: string;
    foodType: string;
    search: string;
  };
}

const initialState: DonationsState = {
  donations: [],
  myDonations: [],
  selectedDonation: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
  },
  filters: {
    status: "all",
    foodType: "all",
    search: "",
  },
};

// Async thunks
export const fetchDonations = createAsyncThunk(
  "donations/fetchAll",
  async (
    params: {
      status?: string;
      foodType?: string;
      search?: string;
      page?: number;
      limit?: number;
      lat?: number;
      lng?: number;
      radius?: number;
    } = {},
    { rejectWithValue }: any
  ) => {
    try {
      const response = await donationsAPI.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch donations"
      );
    }
  }
);

export const fetchMyDonations = createAsyncThunk(
  "donations/fetchMy",
  async (
    params: { status?: string; page?: number; limit?: number } = {},
    { rejectWithValue }: any
  ) => {
    try {
      const response = await donationsAPI.getMy(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your donations"
      );
    }
  }
);

export const fetchDonationById = createAsyncThunk(
  "donations/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await donationsAPI.getById(id);
      return response.data.donation;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch donation"
      );
    }
  }
);

export const createDonation = createAsyncThunk(
  "donations/create",
  async (
    data: Parameters<typeof donationsAPI.create>[0],
    { rejectWithValue }
  ) => {
    try {
      const response = await donationsAPI.create(data);
      return response.data.donation;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create donation"
      );
    }
  }
);

export const updateDonation = createAsyncThunk(
  "donations/update",
  async (
    { id, data }: { id: string; data: Partial<Donation> },
    { rejectWithValue }
  ) => {
    try {
      const response = await donationsAPI.update(id, data);
      return response.data.donation;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update donation"
      );
    }
  }
);

export const deleteDonation = createAsyncThunk(
  "donations/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await donationsAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete donation"
      );
    }
  }
);

export const fetchDonationStats = createAsyncThunk(
  "donations/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await donationsAPI.getStats();
      return response.data.stats;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats"
      );
    }
  }
);

const donationsSlice = createSlice({
  name: "donations",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<DonationsState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedDonation: (state, action: PayloadAction<Donation | null>) => {
      state.selectedDonation = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateDonationStatus: (
      state,
      action: PayloadAction<{ id: string; status: Donation["status"] }>
    ) => {
      const { id, status } = action.payload;
      const donation = state.donations.find((d) => d._id === id);
      if (donation) {
        donation.status = status;
      }
      const myDonation = state.myDonations.find((d) => d._id === id);
      if (myDonation) {
        myDonation.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all donations
      .addCase(fetchDonations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDonations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.donations = action.payload.donations;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchDonations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my donations
      .addCase(fetchMyDonations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyDonations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDonations = action.payload.donations;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchMyDonations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetchDonationById.fulfilled, (state, action) => {
        state.selectedDonation = action.payload;
      })
      // Create donation
      .addCase(createDonation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDonation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDonations.unshift(action.payload);
      })
      .addCase(createDonation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update donation
      .addCase(updateDonation.fulfilled, (state, action) => {
        const index = state.myDonations.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) {
          state.myDonations[index] = action.payload;
        }
        if (state.selectedDonation?._id === action.payload._id) {
          state.selectedDonation = action.payload;
        }
      })
      // Delete donation
      .addCase(deleteDonation.fulfilled, (state, action) => {
        state.myDonations = state.myDonations.filter(
          (d) => d._id !== action.payload
        );
      })
      // Fetch stats
      .addCase(fetchDonationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setSelectedDonation,
  clearError,
  updateDonationStatus,
} = donationsSlice.actions;

export default donationsSlice.reducer;
