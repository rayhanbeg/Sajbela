import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { productsAPI } from "../api"

// Async thunks
export const fetchProducts = createAsyncThunk("products/fetchProducts", async (params, { rejectWithValue }) => {
  try {
    const response = await productsAPI.getAll(params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch products")
  }
})

export const fetchProductById = createAsyncThunk("products/fetchProductById", async (id, { rejectWithValue }) => {
  try {
    const response = await productsAPI.getById(id)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch product")
  }
})

export const searchProducts = createAsyncThunk("products/searchProducts", async (query, { rejectWithValue }) => {
  try {
    const response = await productsAPI.search(query)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Search failed")
  }
})

export const createProduct = createAsyncThunk("products/createProduct", async (productData, { rejectWithValue }) => {
  try {
    const response = await productsAPI.create(productData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create product")
  }
})

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.update(id, productData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update product")
    }
  },
)

export const deleteProduct = createAsyncThunk("products/deleteProduct", async (id, { rejectWithValue }) => {
  try {
    await productsAPI.delete(id)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete product")
  }
})

const initialState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    category: "",
    search: "",
    sort: "newest",
    price: "",
    color: "",
  },
}

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload.products
        state.pagination = action.payload.pagination
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false
        state.currentProduct = action.payload
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Search Products
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.products = action.payload.products
        state.pagination = action.payload.pagination
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products.unshift(action.payload.product)
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false
        const index = state.products.findIndex((p) => p._id === action.payload.product._id)
        if (index !== -1) {
          state.products[index] = action.payload.product
        }
        if (state.currentProduct?._id === action.payload.product._id) {
          state.currentProduct = action.payload.product
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products = state.products.filter((p) => p._id !== action.payload)
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, setFilters, clearCurrentProduct } = productSlice.actions
export default productSlice.reducer
