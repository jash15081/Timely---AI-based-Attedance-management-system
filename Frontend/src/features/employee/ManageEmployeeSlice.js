import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create a new employee
export const createEmployee = createAsyncThunk(
  'manageEmployee/createEmployee',
  async ({ name, email, employeeId, photo }, thunkAPI) => {
    const formData = new FormData();
    formData.append('empid', employeeId);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('file', photo);
    
    try {
      const response = await axios.post(`${API_URL}/employee`, formData, {
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

// Fetch single employee
export const fetchEmployeeById = createAsyncThunk(
  'manageEmployee/fetchEmployeeById',
  async (id, thunkAPI) => {
    try {
      const res = await axios.get(`${API_URL}/employee/${id}`, {
        withCredentials: true,
      });
      return res.data.employee;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

// Update employee details
export const updateEmployee = createAsyncThunk(
  'manageEmployee/updateEmployee',
  async ({ id, name, email, employeeId,password }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('empid', employeeId);
      formData.append('password',password);
      const res = await axios.put(`${API_URL}/employee/${id}`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Update Employee Response:', res.data);
      return res.data.emp;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

// Delete employee
export const deleteEmployee = createAsyncThunk(
  'manageEmployee/deleteEmployee',
  async (id, thunkAPI) => {
    try {
      const res = await axios.delete(`${API_URL}/employee/${id}`, {
        withCredentials: true,
      });
      return res.data; // You might want to return the deleted employee ID or success message
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

const manageEmployeeSlice = createSlice({
  name: 'manageEmployee',
  initialState: {
    creating: false,
    fetching: false,
    updating: false,
    deleting: false,
    error: null,
    employee: null,
    message: null,
  },
  reducers: {
    reset: (state) => {
      state.creating = false;
      state.error = null;
      state.employee = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createEmployee.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.creating = false;
        state.employee = action.payload;
        state.message = 'Employee Created!';
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
        state.message = null;
      })

      // Fetch
      .addCase(fetchEmployeeById.pending, (state) => {
        state.fetching = true;
        state.error = null;
        state.message = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.fetching = false;
        state.employee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.fetching = false;
        state.error = action.payload;
        state.message = null;
      })

      // Update
      .addCase(updateEmployee.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updating = false;
        state.employee = action.payload;
        state.message = 'Employee details updated!';
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
        state.message = null;
      })

      // Delete
      .addCase(deleteEmployee.pending, (state) => {
        state.deleting = true;
        state.error = null;
        state.message = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.deleting = false;
        state.employee = null;
        state.message = 'Employee deleted successfully!';
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
        state.message = null;
      });
  },
});

export const { clearManageEmployeeState } = manageEmployeeSlice.actions;
export default manageEmployeeSlice.reducer;