/**
 * The cart a shopper has before they have an account.
 *
 * Until now the cart lived only on the server: `POST /cart/add` is behind
 * `auth`, and every cart thunk bailed out with "Please login to add items to
 * cart" for anyone signed out. So the first thing a new visitor was asked to do
 * was create an account — before seeing a total, a delivery charge, or anything
 * else that might make the account feel worth creating.
 *
 * This is the same cart, in localStorage. The line shape deliberately mirrors a
 * populated server cart item (`{ _id, product: {...}, quantity, price }`) so
 * `readCartItem` in lib/cart normalises both without knowing which it has, and
 * no rendering code needs a guest branch.
 *
 * On login the lines are replayed into the server cart and this store is
 * emptied — see `mergeGuestCart` in store/cartSlice.
 */

const STORAGE_KEY = "sajbela.cart.guest.v1"

/**
 * Line identity. Same product in two sizes is two lines, so the key has to
 * include the variant — and it has to be derived rather than random, or the
 * same add twice would stack up duplicate lines instead of merging.
 */
export function lineId(productId, selectedSize, selectedColor) {
  return `guest:${productId}:${selectedSize || ""}:${selectedColor || ""}`
}

/**
 * Only the fields the cart UI reads. Products carry a description, tags and a
 * full variant matrix; storing all of that per line fills the 5MB localStorage
 * budget surprisingly fast on a big cart.
 */
function snapshot(product) {
  return {
    _id: product._id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    category: product.category,
    stock: product.stock,
    images: (product.images || []).slice(0, 1).map((image) => ({ url: image.url })),
    sizes: product.sizes || [],
    colors: product.colors || [],
  }
}

/** How many of this exact variant the shop has. Mirrors cartController.addToCart. */
export function availableStock(product, selectedSize, selectedColor) {
  if (product?.category === "bangles" && selectedSize) {
    const size = (product.sizes || []).find((entry) => entry.size === selectedSize)
    return size?.available ? Number(size.stock) || 0 : 0
  }

  if (product?.colors?.length > 0 && selectedColor) {
    const color = product.colors.find((entry) => entry.name === selectedColor)
    return color?.available ? Number(color.stock) || 0 : 0
  }

  return Number(product?.stock) || 0
}

export function readGuestCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt or unavailable storage shouldn't take the whole cart page down.
    return []
  }
}

function writeGuestCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* Private mode / quota — the cart just won't survive a refresh. */
  }
  return items
}

/** The `{ items, totalAmount, totalItems }` shape every cart thunk resolves to. */
export function guestCartState(items = readGuestCart()) {
  return {
    items,
    totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

export function hasGuestCart() {
  return readGuestCart().length > 0
}

/**
 * Add, or top up an existing line.
 *
 * Throws with the same messages the server uses for the same conditions, so the
 * toast a guest sees matches the one a signed-in shopper sees.
 */
export function addGuestItem({ product, quantity = 1, selectedSize = null, selectedColor = null }) {
  const stock = availableStock(product, selectedSize, selectedColor)

  if (stock <= 0) {
    throw new Error(selectedSize || selectedColor ? "That option is out of stock" : "This product is out of stock")
  }

  const items = readGuestCart()
  const id = lineId(product._id, selectedSize, selectedColor)
  const existing = items.find((item) => item._id === id)

  if (existing) {
    const next = existing.quantity + quantity
    if (next > stock) {
      throw new Error(`Cannot add more items. Only ${stock} available in stock`)
    }
    existing.quantity = next
  } else {
    if (quantity > stock) {
      throw new Error(`Only ${stock} items available in stock`)
    }
    items.push({
      _id: id,
      product: snapshot(product),
      quantity,
      selectedSize,
      selectedColor,
      price: product.price,
      addedAt: new Date().toISOString(),
    })
  }

  return guestCartState(writeGuestCart(items))
}

export function updateGuestItem(itemId, quantity) {
  let items = readGuestCart()

  if (quantity <= 0) {
    items = items.filter((item) => item._id !== itemId)
  } else {
    const line = items.find((item) => item._id === itemId)
    if (!line) throw new Error("Item not found in cart")

    const stock = availableStock(line.product, line.selectedSize, line.selectedColor)
    if (stock && quantity > stock) {
      throw new Error(`Only ${stock} items available in stock`)
    }
    line.quantity = quantity
  }

  return guestCartState(writeGuestCart(items))
}

export function removeGuestItem(itemId) {
  return guestCartState(writeGuestCart(readGuestCart().filter((item) => item._id !== itemId)))
}

export function clearGuestCart() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* Nothing to do — the in-memory state is cleared by the caller regardless. */
  }
  return { items: [], totalAmount: 0, totalItems: 0 }
}
