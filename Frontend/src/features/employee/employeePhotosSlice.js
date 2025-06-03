// features/employeePhotos/employeePhotosSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const fetchEmployeePhotos = createAsyncThunk(
  'employeePhotos/fetch',
  async (id) => {
    console.log('Fetching Employee Photos for ID:', id);
    const res = await axios.get(`${API_URL}/employee/photos/${id}`, {
      withCredentials: true,
    });
    console.log('Fetched Employee Photos:', res.data);
    return res.data.urls; // assume array of URLs
  }
);

export const addEmployeePhoto = createAsyncThunk(
  'employeePhotos/add',
  async ({ id, file }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(
        `${API_URL}/employee/addphoto/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log(res.data);
      return res.data.photo_url;
      // Expected to include updated list of photo URLs or photo info
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

// Delete a photo by filename
export const deleteEmployeePhoto = createAsyncThunk(
  'employeePhotos/delete',
  async ({ id, fileName }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append('file', fileName);

      const res = await axios.post(
        `${API_URL}/employee/deletephoto/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return fileName;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.detail || err.message
      );
    }
  }
);

const employeePhotosSlice = createSlice({
  name: 'employeePhotos',
  initialState: {
    photos: [],
    loading: false,
    error: null,
  },
  reducers: {
     reset: (state) => {
      state.photos = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchEmployeePhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeePhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
      })
      .addCase(fetchEmployeePhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch photos';
      })

      // ADD
      .addCase(addEmployeePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEmployeePhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.photos.push(action.payload);
      })
      .addCase(addEmployeePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add photo';
      })

      // DELETE
      .addCase(deleteEmployeePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployeePhoto.fulfilled, (state, action) => {
        state.loading = false;
        const fileName = action.payload;
        state.photos = state.photos.filter((url) => !url.includes(fileName));
      })
      .addCase(deleteEmployeePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete photo';
      });
  },
});

export default employeePhotosSlice.reducer;
