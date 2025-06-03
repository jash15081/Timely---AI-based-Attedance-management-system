import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from 'axios';
import { ArchiveIcon } from "lucide-react";
import { act } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL; // replace with your actual base URL

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  role: null, // 'admin' or 'employee'
  loading: false,
  error: null,
  resetPasswordLoading: false,
  resetPasswordSuccess: false,
  resetPasswordError: null,
};
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Logout failed");
    }
  }
);

export const getme = createAsyncThunk(
  'auth/getme',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/getme`, { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Something went wrong !");
    }
  }
);

export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async ({username,password}, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('username',username)
      formData.append('password',password)
      const response = await axios.post(`${API_URL}/login`, formData, { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Admin login failed");
    }
  }
);

export const loginEmployee = createAsyncThunk(
  "auth/loginEmployee",
  async ({empid,password}, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('empid',empid)
      formData.append('password',password)
      const response = await axios.post(`${API_URL}/employee/login`, formData, { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Employee login failed");
    }
  }
);

export const resetAdminPassword = createAsyncThunk(
  "auth/resetAdminPassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('username',passwordData.username)
      formData.append('old_password',passwordData.oldPassword)
      formData.append('new_password',passwordData.newPassword)
      console.log(passwordData.username)
      const response = await axios.post(`${API_URL}/admin/change-password`, formData, { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Admin password reset failed");
    }
  }
);

export const resetEmployeePassword = createAsyncThunk(
  "auth/resetEmployeePassword",
  async (passwordData, { rejectWithValue }) => {
    const formData = new FormData()
      formData.append('empid',passwordData.empid)
      formData.append('old_password',passwordData.oldPassword)
      formData.append('new_password',passwordData.newPassword)
    try {
      const response = await axios.post(`${API_URL}/employee/change-password`, formData, { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Employee password reset failed");
    }
  }
);

// Create slice
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearResetPasswordState: (state) => {
      state.resetPasswordLoading = false;
      state.resetPasswordSuccess = false;
      state.resetPasswordError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Admin login cases
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        if(action.payload?.username == 'superuser'){
            state.role = 'superuser'
        }
        else{
            state.role = "admin";
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.error = action.payload;
      })

      // Employee login cases
      .addCase(loginEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.role = "employee";
      })
      .addCase(loginEmployee.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.error = action.payload;
      })

      // Admin password reset cases
      .addCase(resetAdminPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordSuccess = false;
        state.resetPasswordError = null;
      })
      .addCase(resetAdminPassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = true;
        state.resetPasswordError = null;
      })
      .addCase(resetAdminPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = false;
        state.resetPasswordError = action.payload;
      })

      // Employee password reset cases
      .addCase(resetEmployeePassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordSuccess = false;
        state.resetPasswordError = null;
      })
      .addCase(resetEmployeePassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = true;
        state.resetPasswordError = null;
      })
      .addCase(resetEmployeePassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = false;
        state.resetPasswordError = action.payload;
      })

      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(getme.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getme.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      // Optionally infer role from user object, if available
      if (action.payload?.empid) {
        state.role = "employee";
      } else {
        if(action.payload?.username == 'superuser'){
            state.role = "superuser";        
        }
        else{
            state.role = "admin"
        }
      }
    })
    .addCase(getme.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;
      if(action.payload != "Authentication failed"){
          state.error = action.payload;
      }
      else{
        state.error = null
      }
    });
  },
});

// Export actions
export const { clearAuthError, clearResetPasswordState } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectResetPasswordState = (state) => ({
  loading: state.auth.resetPasswordLoading,
  success: state.auth.resetPasswordSuccess,
  error: state.auth.resetPasswordError,
});

export default authSlice.reducer;
