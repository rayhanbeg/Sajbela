import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api, { productsAPI } from "../api"
import { logout } from "./authSlice"
import {
  addGuestItem,
  clearGuestCart,
  guestCartState,
  readGuestCart,
  removeGuestItem,
  updateGuestItem,
} from "../guestCart"

/**
 * Cart state, for shoppers with and without an account.
 *
 * Every thunk here used to open with `if (!auth.isAuthenticated) throw "Please
 * login to add items to cart"`, which is what forced a signup before a visitor
 * could see so much as a subtotal. Each one now has a guest branch backed by
 * localStorage (lib/guestCart) that resolves the same
 * `{ items, totalAmount, totalItems }` shape, so the reducers below don't care
 * which side the cart came from.
 */

export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState()
    if (!auth.isAuthenticated) return guestCartState()

    const response = await api.get("/cart")
    return response.data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch cart")
  }
})

export const addToCartAsync = createAsyncThunk(
  "cart/addToCartAsync",
  async ({ productId, quantity = 1, selectedSize, selectedColor, product }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()

      if (!auth.isAuthenticated) {
        // A guest line stores its own product snapshot, since there's no
        // server-side populate to fill one in later. Callers that already hold
        // the product pass it; the rest cost one extra GET.
        const full = product || (await productsAPI.getById(productId)).data
        return addGuestItem({
          product: full,
          quantity,
          selectedSize: selectedSize || null,
          selectedColor: selectedColor || null,
        })
      }

      const response = await api.post("/cart/add", { productId, quantity, selectedSize, selectedColor })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to add to cart")
    }
  },
)

export const updateCartItemAsync = createAsyncThunk(
  "cart/updateItem",
  async ({ itemId, quantity }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      if (!auth.isAuthenticated) return updateGuestItem(itemId, quantity)

      const response = await api.put("/cart/update", { itemId, quantity })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update cart")
    }
  },
)

export const removeFromCartAsync = createAsyncThunk(
  "cart/removeItem",
  async (itemId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      if (!auth.isAuthenticated) return removeGuestItem(itemId)

      const response = await api.delete(`/cart/remove/${itemId}`)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to remove item")
    }
  },
)

export const clearCartAsync = createAsyncThunk("cart/clearCart", async (_, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState()
    if (!auth.isAuthenticated) return clearGuestCart()

    const response = await api.delete("/cart/clear")
    return response.data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || "Failed to clear cart")
  }
})

/**
 * Move a guest cart onto the account that just signed in.
 *
 * Replayed through `POST /cart/add` one line at a time rather than a bulk
 * endpoint, so each line goes through the server's own stock checks. A line
 * that no longer fits (sold out while it sat in localStorage) is skipped rather
 * than failing the whole merge — losing one item silently is bad, losing the
 * entire cart at the moment of login is worse. The count of skipped lines comes
 * back so the UI can say something.
 *
 * The local store is cleared either way: leaving it populated means the next
 * logout resurrects items the shopper has already bought.
 */
export const mergeGuestCart = createAsyncThunk("cart/mergeGuest", async (_, { rejectWithValue }) => {
  try {
    const guestItems = readGuestCart()
    if (guestItems.length === 0) return null

    let skipped = 0

    for (const item of guestItems) {
      try {
        await api.post("/cart/add", {
          productId: item.product?._id,
          quantity: item.quantity,
          selectedSize: item.selectedSize || undefined,
          selectedColor: item.selectedColor || undefined,
        })
      } catch {
        skipped += 1
      }
    }

    clearGuestCart()

    const response = await api.get("/cart")
    return { ...response.data.data, merged: guestItems.length - skipped, skipped }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to move your cart")
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

/** Every fulfilled cart thunk lands here — one place that maps a cart to state. */
function applyCart(state, cart) {
  if (!cart) return
  state.items = cart.items || []
  state.totalAmount = cart.totalAmount || 0
  state.totalItems = cart.totalItems || 0
  state.itemCount = cart.totalItems || 0
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
        state.loading = false
        state.initialized = true
        applyCart(state, action.payload)
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
        state.loading = false
        applyCart(state, action.payload)
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        applyCart(state, action.payload)
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        applyCart(state, action.payload)
      })
      .addCase(clearCartAsync.fulfilled, (state, action) => {
        applyCart(state, action.payload)
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.initialized = true
        applyCart(state, action.payload)
      })
      /*
       * Signing out must drop the cart from memory. It's the account's cart, on
       * the server — leaving it in state showed the next person at the same
       * browser someone else's items, and the badge kept its count until the
       * page was reloaded.
       */
      .addCase(logout, (state) => {
        state.items = []
        state.totalAmount = 0
        state.totalItems = 0
        state.itemCount = 0
        state.initialized = false
      })
  },
})

export const { clearError, setInitialized } = cartSlice.actions

// Aliases kept for the call sites that use them.
export const addToCart = addToCartAsync
export const clearCart = clearCartAsync
export const updateCartItem = updateCartItemAsync
export const updateQuantity = updateCartItemAsync
export const removeFromCart = removeFromCartAsync
export const fetchCartData = fetchCart
export const fetchCartItems = fetchCart
export const getCart = fetchCart
export const loadCart = fetchCart

export default cartSlice.reducer
