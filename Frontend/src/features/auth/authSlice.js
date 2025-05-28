import { createSlice,createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { configDotenv } from "dotenv";

const API_URL = import.meta.env.VITE_API_URL;

export const loginUser = createAsyncThunk("auth/loginUser", async (userData, thunkAPI) => {
    try{    
        console.log("trying to login",userData,API_URL)
        const response = await axios.post(`${API_URL}/login`, userData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                
            },
            withCredentials: true,
        });
        console.log("response",response)
        return response.data;
    }
    catch (error) {
        console.log("error",error)
        const message = error.response.data.detail || "Something went wrong";
        return thunkAPI.rejectWithValue(message);
    }
})

export const getme = createAsyncThunk("auth/getme", async (_, thunkAPI) => {
    try {
        const response = await axios.get(`${API_URL}/getme`, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        const message = error.response.data.detail || "Something went wrong";
        return thunkAPI.rejectWithValue(message);
    }
});

export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, thunkAPI) => {
    try {
        const response = await axios.post(`${API_URL}/logout`, {}, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        const message = error.response.data.detail || "Something went wrong";
        return thunkAPI.rejectWithValue(message);
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        isLoading: false,
        isUserLoading: false,
        isError: false,
        message: "",
        superuser: false,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.user = action.payload;
                state.superuser = action.payload.username == "superuser" || false;
            })
            .addCase(loginUser.rejected, (state, action) => {
                console.log("rejected",action)
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.superuser = false;
            })
            .addCase(getme.pending, (state) => {
                state.isUserLoading = true;
            })
            .addCase(getme.fulfilled, (state, action) => {
                state.isUserLoading = false;
                state.isError = false;
                state.user = action.payload;
                state.superuser = action.payload.username == "superuser" || false;
            })
            .addCase(getme.rejected, (state, action) => {
                state.isUserLoading = false;
                state.isError = true;
                state.user = null; 
                state.superuser = false; 
            }).addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoading = false;
                state.isError = false;
                state.user = null;
                state.superuser = false;
            }).addCase(logoutUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.superuser = false;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;