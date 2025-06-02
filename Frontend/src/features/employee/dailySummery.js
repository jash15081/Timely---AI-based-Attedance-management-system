import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

// Replace with your actual API base URL
const API_URL = import.meta.env.VITE_API_URL

// Async thunk to fetch attendance summary
export const fetchAttendanceSummary = createAsyncThunk(
  "attendanceSummary/fetch",
  async (date, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/employee/summary/${date}`,{withCredentials:true})
      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

const attendanceSummarySlice = createSlice({
  name: "attendanceSummary",
  initialState: {
    loading: false,
    error: null,
    date: null,
    totalEmployees: 0,
    totalPresent: 0,
    totalAbsent: 0,
    presentEmployees: [],
    absentEmployees: []
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceSummary.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        const {
          date,
          totalEmployees,
          totalPresent,
          totalAbsent,
          presentEmployees,
          absentEmployees
        } = action.payload

        state.loading = false
        state.date = date
        state.totalEmployees = totalEmployees
        state.totalPresent = totalPresent
        state.totalAbsent = totalAbsent
        state.presentEmployees = presentEmployees
        state.absentEmployees = absentEmployees
      })
      .addCase(fetchAttendanceSummary.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export default attendanceSummarySlice.reducer
