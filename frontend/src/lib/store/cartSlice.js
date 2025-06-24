import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../api"

// Async thunks for cart operations
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState()
    if (!auth.isAuthenticated) {
      return {
        items: [],
        totalAmount: 0,
        totalItems: 0,
      }
    }

    console.log("Fetching cart from API...")
    const response = await api.get("/cart")
    console.log("Cart API response:", response.data)
    return response.data.data
  } catch (error) {
    console.error("Failed to fetch cart from API:", error)
    return rejectWithValue(error.response?.data?.message || "Failed to fetch cart")
  }
})

export const addToCartAsync = createAsyncThunk(
  "cart/addToCartAsync",
  async ({ productId, quantity = 1, selectedSize, selectedColor }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      if (!auth.isAuthenticated) {
        throw new Error("Please login to add items to cart")
      }

      console.log("Adding to cart:", { productId, quantity, selectedSize, selectedColor })
      const response = await api.post("/cart/add", {
        productId,
        quantity,
        selectedSize,
        selectedColor,
      })
      console.log("Add to cart response:", response.data)
      return response.data.data
    } catch (error) {
      console.error("Add to cart error:", error)
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to add to cart")
    }
  },
)

export const updateCartItemAsync = createAsyncThunk(
  "cart/updateItem",
  async ({ itemId, quantity }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      if (!auth.isAuthenticated) {
        throw new Error("Please login to update cart")
      }

      console.log("Updating cart item:", { itemId, quantity })
      const response = await api.put("/cart/update", {
        itemId,
        quantity,
      })
      console.log("Update cart response:", response.data)
      return response.data.data
    } catch (error) {
      console.error("Update cart error:", error)
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update cart")
    }
  },
)

export const removeFromCartAsync = createAsyncThunk(
  "cart/removeItem",
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      if (!auth.isAuthenticated) {
        throw new Error("Please login to remove items from cart")
      }

      console.log("Removing cart item:", itemId)
      const response = await api.delete(`/cart/remove/${itemId}`)
      console.log("Remove cart response:", response.data)
      return response.data.data
    } catch (error) {
      console.error("Remove cart error:", error)
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to remove item")
    }
  },
)

export const clearCartAsync = createAsyncThunk("cart/clearCart", async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState()
    if (!auth.isAuthenticated) {
      throw new Error("Please login to clear cart")
    }

    console.log("Clearing cart...")
    const response = await api.delete("/cart/clear")
    console.log("Clear cart response:", response.data)
    return response.data.data
  } catch (error) {
    console.error("Clear cart error:", error)
    return rejectWithValue(error.response?.data?.message || error.message || "Failed to clear cart")
  }
})

const initialState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  itemCount: 0,
  loading: false,
  error: null,
  initialized: false,
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setInitialized: (state) => {
      state.initialized = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        console.log("fetchCart fulfilled with data:", action.payload)
        state.loading = false
        state.initialized = true
        state.items = action.payload.items || []
        state.totalAmount = action.payload.totalAmount || 0
        state.totalItems = action.payload.totalItems || 0
        state.itemCount = action.payload.totalItems || 0
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.initialized = true
        state.error = action.payload
      })
      .addCase(addToCartAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        console.log("addToCartAsync fulfilled with data:", action.payload)
        state.loading = false
        state.items = action.payload.items
        state.totalAmount = action.payload.totalAmount
        state.totalItems = action.payload.totalItems
        state.itemCount = action.payload.totalItems
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        console.log("updateCartItemAsync fulfilled with data:", action.payload)
        state.items = action.payload.items
        state.totalAmount = action.payload.totalAmount
        state.totalItems = action.payload.totalItems
        state.itemCount = action.payload.totalItems
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        console.log("removeFromCartAsync fulfilled with data:", action.payload)
        state.items = action.payload.items
        state.totalAmount = action.payload.totalAmount
        state.totalItems = action.payload.totalItems
        state.itemCount = action.payload.totalItems
      })
      .addCase(clearCartAsync.fulfilled, (state, action) => {
        console.log("clearCartAsync fulfilled with data:", action.payload)
        state.items = action.payload.items || []
        state.totalAmount = action.payload.totalAmount || 0
        state.totalItems = action.payload.totalItems || 0
        state.itemCount = action.payload.totalItems || 0
      })
  },
})

export const { clearError, setInitialized } = cartSlice.actions

// ✅ Export all function aliases for compatibility
export const addToCart = addToCartAsync
export const clearCart = clearCartAsync
export const updateCartItem = updateCartItemAsync
export const updateQuantity = updateCartItemAsync
export const removeFromCart = removeFromCartAsync
export const fetchCartData = fetchCart
export const fetchCartItems = fetchCart // ✅ Added missing alias
export const getCart = fetchCart // ✅ Additional alias
export const loadCart = fetchCart // ✅ Additional alias

export default cartSlice.reducer
