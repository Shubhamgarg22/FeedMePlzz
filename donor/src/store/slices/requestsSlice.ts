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
      organizationName?: string;
    };
  };
  receiverId: string;
  status: "accepted" | "picked_up" | "delivered" | "cancelled";
  acceptedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  donorRating?: number;
  createdAt: string;
}

interface RequestsState {
  myRequests: Request[];
  activeRequest: Request | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RequestsState = {
  myRequests: [],
  activeRequest: null,
  isLoading: false,
  error: null,
};

export const acceptDonation = createAsyncThunk(
  "requests/accept",
  async ({ donationId }: { donationId: string }, { rejectWithValue }) => {
    try {
      const response = await requestsAPI.accept(donationId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to claim donation"
      );
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  "requests/updateStatus",
  async (
    { requestId, status }: { requestId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await requestsAPI.updateStatus(requestId, status);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

export const fetchMyRequests = createAsyncThunk(
  "requests/fetchMy",
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await requestsAPI.getMy(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch requests"
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
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        const updated = action.payload.request;
        if (state.activeRequest?._id === updated._id) {
          state.activeRequest = updated;
        }
        state.myRequests = state.myRequests.map((r) =>
          r._id === updated._id ? updated : r
        );
        if (["delivered", "cancelled"].includes(updated.status)) {
          state.activeRequest = null;
        }
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
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveRequest, clearError } = requestsSlice.actions;
export default requestsSlice.reducer;
