import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { requestsAPI } from "../../services/api";

export interface Request {
  _id: string;
  donationId: {
    _id: string;
    foodName: string;
    foodType: string;
    quantity: number;
    quantityUnit: string;
    pickupLocation: {
      address: string;
      lat: number;
      lng: number;
    };
    imageUrl?: string;
    donorId: {
      name: string;
      phone: string;
    };
  };
  volunteerId: string;
  status: "accepted" | "picked_up" | "delivered" | "cancelled";
  acceptedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  volunteerLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  donorRating?: number;
  donorFeedback?: string;
  createdAt: string;
}

interface RequestsState {
  myRequests: Request[];
  activeRequest: Request | null;
  completedRequests: Request[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RequestsState = {
  myRequests: [],
  activeRequest: null,
  completedRequests: [],
  isLoading: false,
  error: null,
};

export const acceptDonation = createAsyncThunk(
  "requests/accept",
  async (
    { donationId, estimatedPickupTime }: { donationId: string; estimatedPickupTime?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await requestsAPI.accept(donationId, { estimatedPickupTime });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept donation"
      );
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  "requests/updateStatus",
  async (
    { requestId, status, data }: { requestId: string; status: string; data?: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await requestsAPI.updateStatus(requestId, status, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

export const updateVolunteerLocation = createAsyncThunk(
  "requests/updateLocation",
  async (
    { requestId, lat, lng }: { requestId: string; lat: number; lng: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await requestsAPI.updateLocation(requestId, lat, lng);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update location"
      );
    }
  }
);

export const fetchMyRequests = createAsyncThunk(
  "requests/fetchMy",
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await requestsAPI.getMyRequests(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch requests"
      );
    }
  }
);

export const submitRating = createAsyncThunk(
  "requests/submitRating",
  async (
    { requestId, rating, feedback }: { requestId: string; rating: number; feedback?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await requestsAPI.addRating(requestId, rating, feedback);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit rating"
      );
    }
  }
);

const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setActiveRequest: (state, action: PayloadAction<Request | null>) => {
      state.activeRequest = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(acceptDonation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptDonation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeRequest = action.payload.request;
        state.myRequests.unshift(action.payload.request);
      })
      .addCase(acceptDonation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateRequestStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updated = action.payload.request;
        if (state.activeRequest?._id === updated._id) {
          state.activeRequest = updated;
        }
        state.myRequests = state.myRequests.map((r) =>
          r._id === updated._id ? updated : r
        );
        if (updated.status === "delivered") {
          state.completedRequests.unshift(updated);
          state.activeRequest = null;
        }
      })
      .addCase(updateRequestStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myRequests = action.payload.requests || action.payload;
        state.activeRequest =
          state.myRequests.find(
            (r) => r.status === "accepted" || r.status === "picked_up"
          ) || null;
        state.completedRequests = state.myRequests.filter(
          (r) => r.status === "delivered"
        );
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(submitRating.fulfilled, (state, action) => {
        const updated = action.payload.request;
        state.myRequests = state.myRequests.map((r) =>
          r._id === updated._id ? updated : r
        );
      });
  },
});

export const { setActiveRequest, clearError } = requestsSlice.actions;
export default requestsSlice.reducer;
