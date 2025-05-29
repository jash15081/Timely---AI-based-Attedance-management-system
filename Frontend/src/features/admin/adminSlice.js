import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export const fetchAdmins = createAsyncThunk(
  'admins/fetchAdmins',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/admin`, {
        withCredentials: true,
      });
      console.log('Fetched Admins:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching admins:', error);
      const message = error.response?.data?.detail || 'Failed to fetch Admins.';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addAdmin = createAsyncThunk(
  'admins/addAdmin',
  async (adminData, thunkAPI) => {
    try {
      const response = await axios.post(`${API_URL}/admin`, adminData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to add Admin.';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  'admins/deleteAdmin',
  async (adminId, thunkAPI) => {
    try {
      await axios.delete(`${API_URL}/admin/${adminId}`, {
        withCredentials: true,
      });
      return adminId;
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to delete Admin.';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    admins: [],
    isLoading: false,
    isError: false,
    message: '',
  },
  reducers: {
    clearMessage: (state) => {
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmins.pending, (state) => {
        state.isLoading = true;
        state.admins = [];
        state.message = '';
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.isLoading = false;
        state.admins = action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(addAdmin.pending, (state) => {
        state.isLoading = true;
        state.message = '';
      })
      .addCase(addAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('Admin added:', action.payload);

        state.admins.push(action.payload[0]);
      })
      .addCase(addAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteAdmin.pending, (state) => {
        state.isLoading = true;
        state.message = '';
      })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.admins = state.admins.filter(
          (admin) => admin.id !== action.payload
        );
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearMessage } = adminSlice.actions;
export default adminSlice.reducer;
