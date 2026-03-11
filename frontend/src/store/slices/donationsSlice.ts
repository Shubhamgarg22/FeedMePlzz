import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { donationsAPI } from "../../services/api";

export interface Donation {
  _id: string;
  donorId: {
    _id: string;
    name: string;
    phone: string;
    organizationName?: string;
  };
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
  status: string;
  specialInstructions?: string;
  allergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  distance?: number;
  createdAt: string;
}

interface DonationsState {
  availableDonations: Donation[];
  nearbyDonations: Donation[];
  selectedDonation: Donation | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    foodType: string;
    distance: number;
    vegetarianOnly: boolean;
    veganOnly: boolean;
  };
}

const initialState: DonationsState = {
  availableDonations: [],
  nearbyDonations: [],
  selectedDonation: null,
  isLoading: false,
  error: null,
  filters: {
    foodType: "all",
    distance: 10,
    vegetarianOnly: false,
    veganOnly: false,
  },
};

export const fetchAvailableDonations = createAsyncThunk(
  "donations/fetchAvailable",
  async (params: any = {}, { rejectWithValue }: any) => {
    try {
      const response = await donationsAPI.getAvailable(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch donations"
      );
    }
  }
);

export const fetchNearbyDonations = createAsyncThunk(
  "donations/fetchNearby",
  async (
    { lat, lng, radius }: { lat: number; lng: number; radius?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await donationsAPI.getNearby(lat, lng, radius);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch nearby donations"
      );
    }
  }
);

export const fetchDonationDetails = createAsyncThunk(
  "donations/fetchDetails",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await donationsAPI.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch donation details"
      );
    }
  }
);

const donationsSlice = createSlice({
  name: "donations",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<DonationsState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedDonation: (state) => {
      state.selectedDonation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableDonations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableDonations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableDonations = action.payload.donations || action.payload;
      })
      .addCase(fetchAvailableDonations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchNearbyDonations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyDonations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyDonations = action.payload.donations || action.payload;
      })
      .addCase(fetchNearbyDonations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDonationDetails.fulfilled, (state, action) => {
        state.selectedDonation = action.payload.donation || action.payload;
      });
  },
});

export const { setFilters, clearSelectedDonation, clearError } = donationsSlice.actions;
export default donationsSlice.reducer;
