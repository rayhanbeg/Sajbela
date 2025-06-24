import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { ordersAPI } from "../api"

// Async thunks
export const createOrder = createAsyncThunk("orders/createOrder", async (orderData, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.create(orderData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create order")
  }
})

export const fetchMyOrders = createAsyncThunk("orders/fetchMyOrders", async (_, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getMyOrders()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch orders")
  }
})

export const fetchOrderById = createAsyncThunk("orders/fetchOrderById", async (id, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getById(id)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch order")
  }
})

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.updateStatus(id, status)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update order status")
    }
  },
)

export const cancelOrder = createAsyncThunk("orders/cancelOrder", async (orderId, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.cancel(orderId)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to cancel order")
  }
})

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  orderStats: {
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  },
}

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        state.orders.unshift(action.payload)
        state.currentOrder = action.payload
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex((o) => o._id === action.payload._id)
        if (index !== -1) {
          state.orders[index] = action.payload
        }
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload
        }
      })
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false
        const index = state.orders.findIndex((o) => o._id === action.payload.order._id)
        if (index !== -1) {
          state.orders[index] = action.payload.order
        }
        if (state.currentOrder?._id === action.payload.order._id) {
          state.currentOrder = action.payload.order
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearCurrentOrder } = orderSlice.actions
export default orderSlice.reducer
