// src/redux/slices/configureSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const saveConfiguration = createAsyncThunk(
  'configure/saveConfiguration',
  async ({ entranceUrl, exitUrl }, { rejectWithValue }) => {
    try {
      await axios.post(
        `${API_URL}/configure`,
        {
          camera_enter: entranceUrl,
          camera_exit: exitUrl,
        },
        { withCredentials: true }
      );
      return '✅ Configuration saved successfully!';
    } catch (err) {
      return rejectWithValue(
        '❌ ' + (err.response?.data?.detail || 'Failed to save configuration.')
      );
    }
  }
);

export const fetchConfiguration = createAsyncThunk(
  'configure/fetchConfiguration',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/configure`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        '❌ ' + (err.response?.data?.detail || 'Failed to fetch configuration.')
      );
    }
  }
);
const configureSlice = createSlice({
  name: 'configure',
  initialState: {
    entranceUrl: '',
    exitUrl: '',
    message: '',
    loading: false,
    fetching: false,
  },
  reducers: {
    setEntranceUrl: (state, action) => {
      state.entranceUrl = action.payload;
    },
    setExitUrl: (state, action) => {
      state.exitUrl = action.payload;
    },
    clearMessage: (state) => {
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveConfiguration.pending, (state) => {
        state.loading = true;
        state.message = '';
      })
      .addCase(saveConfiguration.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(saveConfiguration.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(fetchConfiguration.pending, (state) => {
        state.loading = true;
        state.fetching = true;
        state.entranceUrl = '';
        state.exitUrl = '';
        state.message = '';
      })
      .addCase(fetchConfiguration.fulfilled, (state, action) => {
        state.loading = false;
        state.fetching = false;
        state.entranceUrl = action.payload.camera_enter || '';
        state.exitUrl = action.payload.camera_exit || '';
        state.message = '';
      })
      .addCase(fetchConfiguration.rejected, (state, action) => {
        state.loading = false;
        state.fetching = false;
        state.message = action.payload || '❌ Failed to load configuration.';
      });
  },
});

export const { setEntranceUrl, setExitUrl, clearMessage } =
  configureSlice.actions;
export default configureSlice.reducer;
