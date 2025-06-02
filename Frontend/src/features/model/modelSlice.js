// modelSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const startModel = createAsyncThunk('model/start', async (_, thunkAPI) => {
  try {
    const res = await axios.post(`${API_URL}/model/start`, {}, { withCredentials: true });
    return res.data.message || 'Model started successfully';
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
  }
});

export const stopModel = createAsyncThunk('model/stop', async (_, thunkAPI) => {
  try {
    const res = await axios.post(`${API_URL}/model/stop`, {}, { withCredentials: true });
    return res.data.message || 'Model stopped successfully';
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
  }
});

export const generateEmbeddings = createAsyncThunk('model/embeddings', async (_, thunkAPI) => {
  try {
    const res = await axios.post(`${API_URL}/model/generate-embeddings`, {}, { withCredentials: true });
    return res.data.logs || ['Embeddings generated.'];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
  }
});

export const checkModelStatus = createAsyncThunk('model/checkStatus', async (_, thunkAPI) => {
  try {
    const res = await axios.get(`${API_URL}/model/status`, { withCredentials: true });
    return res.data.status || 'stopped';
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
  }
});

const modelSlice = createSlice({
  name: 'model',
  initialState: {
    status: 'stopped',
    logs: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearLogs: (state) => {
      state.logs = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startModel.pending, (state) => {
        state.isLoading = true;
        state.logs.push('Starting model...');
      })
      .addCase(startModel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'running';
        state.logs.push(action.payload);
      })
      .addCase(startModel.rejected, (state, action) => {
        state.isLoading = false;
        state.logs.push(`❌ ${action.payload}`);
      })

      .addCase(stopModel.pending, (state) => {
        state.isLoading = true;
        state.logs.push('Stopping model...');
      })
      .addCase(stopModel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'stopped';
        state.logs.push(action.payload);
      })
      .addCase(stopModel.rejected, (state, action) => {
        state.isLoading = false;
        state.logs.push(`❌ ${action.payload}`);
      })

      .addCase(generateEmbeddings.pending, (state) => {
        state.isLoading = true;
        state.logs.push('Generating employee embeddings...');
      })
      .addCase(generateEmbeddings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs.push(...action.payload); // append all log lines
      })
      .addCase(generateEmbeddings.rejected, (state, action) => {
        state.isLoading = false;
        state.logs.push(`❌ ${action.payload}`);
      })

      .addCase(checkModelStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkModelStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = action.payload;
      })
      .addCase(checkModelStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.logs.push(`❌ ${action.payload}`);
      });
  },
});

export const { clearLogs } = modelSlice.actions;
export default modelSlice.reducer;
