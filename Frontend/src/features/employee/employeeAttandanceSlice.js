import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Ensure you're using VITE_ prefix for env vars in Vite
const API_URL = import.meta.env.VITE_API_URL;

export const fetchAttendance = createAsyncThunk(
  'employeeAttendance/fetch',
  async ({ id, start_date, end_date }, thunkAPI) => {
    try {
      const response = await axios.get(
        `${API_URL}/employee/attendance/${id}?start_date=${start_date}&end_date=${end_date}`,
        { withCredentials: true }
      );
      console.log(response.data)
      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.detail || error?.message || 'Failed to fetch attendance';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const employeeAttendanceSlice = createSlice({
  name: 'employeeAttendance',
  initialState: {
    days: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.days = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch attendance';
      });
  },
});

export default employeeAttendanceSlice.reducer;
