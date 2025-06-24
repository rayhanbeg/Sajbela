import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authAPI, ordersAPI } from "../api.js"

// Async thunks for authentication
export const loginUser = createAsyncThunk("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await authAPI.login(credentials)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Login failed")
  }
})

export const registerUser = createAsyncThunk("auth/registerUser", async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Registration failed")
  }
})

export const fetchUserProfile = createAsyncThunk("auth/fetchUserProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.getProfile()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch profile")
  }
})

export const updateUserProfile = createAsyncThunk("auth/updateUserProfile", async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.updateProfile(userData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update profile")
  }
})

export const fetchMyOrders = createAsyncThunk("auth/fetchMyOrders", async (_, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getMyOrders()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch orders")
  }
})

// Check if user is already logged in
const token = localStorage.getItem("token")
const user = localStorage.getItem("user")

const initialState = {
  user: user ? JSON.parse(user) : null,
  token: token,
  isAuthenticated: !!token,
  loading: false,
  error: null,
  orders: [],
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      state.orders = []
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    },
    clearError: (state) => {
      state.error = null
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
    },
    // NEW: Update user role in real-time
    updateUserRole: (state, action) => {
      if (state.user) {
        state.user.role = action.payload
        localStorage.setItem("user", JSON.stringify(state.user))
      }
    },
    // NEW: Refresh user profile
    refreshUserProfile: (state, action) => {
      if (state.user && action.payload) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem("user", JSON.stringify(state.user))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem("token", action.payload.token)
        localStorage.setItem("user", JSON.stringify(action.payload.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        localStorage.setItem("token", action.payload.token)
        localStorage.setItem("user", JSON.stringify(action.payload.user))
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        localStorage.setItem("user", JSON.stringify(action.payload))
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        localStorage.setItem("user", JSON.stringify(action.payload.user))
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout, clearError, setCredentials, updateUserRole, refreshUserProfile } = authSlice.actions
export default authSlice.reducer
