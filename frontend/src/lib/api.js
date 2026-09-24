import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle auth errors
//
// This used to hard-redirect to /auth/login on ANY 401, from anywhere. Two
// problems with that: a stale token in localStorage bounced shoppers off public
// pages they were allowed to see, and a 401 while already on /auth/reset-password
// threw them out of the reset flow they were halfway through. Now it only
// clears the session and redirects when there genuinely *was* a session to
// expire, and never while the shopper is already on an auth page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadSession = Boolean(localStorage.getItem("token"))
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      const onAuthPage = window.location.pathname.startsWith("/auth/")
      if (hadSession && !onAuthPage) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/auth/login?returnTo=${returnTo}&expired=1`
      }
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  // Exchanges a Google ID token for an app JWT. See components/auth/GoogleSignIn.
  googleLogin: (credential) => api.post("/auth/google", { credential }),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (userData) => api.put("/auth/profile", userData),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  // Cheap pre-flight so the reset page can say "this link expired" before the
  // shopper types a new password into a form that was never going to work.
  verifyResetToken: (token) => api.get(`/auth/reset-password/${token}`),
  resetPassword: (data) => api.post("/auth/reset-password", data),
}

// Products API
export const productsAPI = {
  getAll: (params) => api.get("/products", { params }),
  // The admin catalogue is a separate endpoint, not `getAll` with a huge limit:
  // it includes retired products and filters/sorts/paginates in Mongo.
  getAdminList: (params) => api.get("/products/admin/list", { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get("/products/featured/list"),
  search: (query) => api.get(`/products?search=${query}`),
  create: (productData) => api.post("/products", productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
}

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post("/orders", orderData),
  getMyOrders: () => api.get("/orders/my"),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get("/orders", { params }),
  // Dashboard totals + daily series, aggregated server-side.
  getStats: (params) => api.get("/orders/stats", { params }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
}

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (reviewData) => api.post("/reviews", reviewData),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  getMyReviews: () => api.get("/reviews/my"),
  getReviewableProducts: () => api.get("/reviews/reviewable"),
  checkReviewExists: (productId, orderId) => api.get(`/reviews/check/${productId}/${orderId}`),
}

// Addresses API
export const addressesAPI = {
  getAll: () => api.get("/addresses"),
  create: (addressData) => api.post("/addresses", addressData),
  update: (id, addressData) => api.put(`/addresses/${id}`, addressData),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.put(`/addresses/${id}/default`),
}

// Users API (Admin only)
//
// `getById` and `updateStatus` used to be declared here and neither endpoint
// exists — routes/users.js has no `GET /:id` and no `PUT /:id/status`, and the
// User model has no `isActive` field. The admin customer table called
// updateStatus from an activate/deactivate toggle that could only ever 404.
// `delete` is the reverse case: the route was there all along with nothing
// calling it.
export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
}

// Cart API
export const cartAPI = {
  getCart: () => api.get("/cart"),
  addToCart: (productId, quantity, size, color) => api.post("/cart/add", { productId, quantity, size, color }),
  updateCartItem: (itemId, quantity) => api.put(`/cart/update/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/cart/remove/${itemId}`),
  clearCart: () => api.delete("/cart/clear"),
}

// Upload API - Fixed delete method
export const uploadAPI = {
  single: (file) => {
    const formData = new FormData()
    formData.append("image", file)
    return api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  multiple: (files) => {
    const formData = new FormData()
    files.forEach((file) => formData.append("images", file))
    return api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  delete: (publicId) => {
    // Send publicId in request body using POST method
    return api.post("/upload/delete", { publicId })
  },
}

export default api
