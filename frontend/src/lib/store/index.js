import { configureStore } from "@reduxjs/toolkit"
import cartReducer from "./cartSlice.js"
import authReducer from "./authSlice.js"
import productReducer from "./productSlice.js"
import orderReducer from "./orderSlice.js"

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    products: productReducer,
    orders: orderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

// For TypeScript users, these would be:
// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch
