import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Thunk to fetch employees
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/employee`, {
        withCredentials: true,
      });
      console.log('Fetched Employees:', response.data);
      return response.data.employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      const message =
        error.response?.data?.detail || 'Failed to fetch employees.';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Slice
const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    isLoading: false,
    isError: false,
    message: '',
  },
  reducers: {
    clearEmployeeMessage: (state) => {
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.employees = [];
        state.message = '';
        state.isError = false;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearEmployeeMessage } = employeeSlice.actions;
export default employeeSlice.reducer;
