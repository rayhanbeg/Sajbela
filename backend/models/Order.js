import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  selectedSize: {
    type: String,
    required: false,
  },
  selectedColor: {
    type: String,
    required: false,
  },
})

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    default: "Bangladesh",
  },
  phone: {
    type: String,
    required: true,
  },
})

/**
 * Who the order is for when there's no account behind it.
 *
 * Checkout already collects a name, phone and address — it never read them from
 * the profile — so the only thing an account was really providing here was an
 * email address to send the confirmation to. That's captured here instead, and
 * `user` is now optional.
 */
const guestInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Guest orders have no account. `default: null` rather than leaving the
      // path unset, so `{ user: null }` queries find them.
      required: false,
      default: null,
      index: true,
    },
    guestInfo: {
      type: guestInfoSchema,
      required: false,
      default: undefined,
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash_on_delivery", "cod", "bkash", "nagad", "rocket"],
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
)

/**
 * One of the two has to be there. Without this an empty body would save an
 * order nobody could be contacted about — `user` alone used to be `required`,
 * which is what made that impossible before guest checkout existed.
 */
orderSchema.pre("validate", function (next) {
  if (!this.user && !this.guestInfo) {
    this.invalidate("user", "An order needs either a user or guest contact details")
  }
  next()
})

export default mongoose.model("Order", orderSchema)
