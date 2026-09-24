import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Boxes,
  GripVertical,
  ImagePlus,
  Info,
  Loader2,
  Palette,
  Ruler,
  Save,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { AdminPageHeader, FormSection } from "../../components/admin"
import {
  Badge,
  Button,
  Checkbox,
  ErrorState,
  FormField,
  IconButton,
  Input,
  Select,
  Skeleton,
  Textarea,
  useConfirm,
  useToast,
} from "../../components/ui"
import { productsAPI, uploadAPI } from "../../lib/api"
import {
  BANGLE_SIZES,
  PRODUCT_CATEGORIES,
  PRODUCT_COLORS,
  PRODUCT_FLAGS,
  imagePublicId,
  isSizedCategory,
  swatch,
} from "../../lib/products"
import { formatPrice } from "../../lib/utils"

/**
 * Create / edit a product.
 *
 * Four field names in the old form didn't match the schema, so the data they
 * collected was silently dropped by Mongoose on save:
 *
 *  - colours were written as `hexCode`; the schema field is `code`, so every
 *    swatch on the storefront fell back to grey
 *  - images were written as `publicId`; the schema field is `public_id`, so
 *    deleting an image from a saved product could never remove it from
 *    Cloudinary — the id wasn't there to send
 *  - `specifications.size` isn't in the schema at all (it's `dimensions`)
 *  - `subcategory` isn't in the schema at all
 *
 * `isActive` was also hard-coded to `true` on every save, which un-retired any
 * product the moment you edited it. It's a real control now.
 *
 * The form talks to the API directly rather than through the product slice:
 * that slice is the storefront's, and dispatching into it from here replaced
 * the shopper's current product and list with admin data.
 */

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "bangles",
  stock: "",
  tags: "",
  specifications: { material: "", color: "", dimensions: "", weight: "" },
  sizes: [],
  colors: [],
  featured: false,
  isNewArrival: false,
  isCombo: false,
  isActive: true,
}

const toForm = (product) => ({
  name: product.name || "",
  description: product.description || "",
  price: product.price ?? "",
  originalPrice: product.originalPrice ?? "",
  category: product.category || "bangles",
  stock: product.stock ?? "",
  tags: (product.tags || []).join(", "),
  specifications: {
    material: product.specifications?.material || "",
    color: product.specifications?.color || "",
    dimensions: product.specifications?.dimensions || "",
    weight: product.specifications?.weight || "",
  },
  sizes: (product.sizes || []).map((size) => ({
    size: size.size,
    measurement: size.measurement || "",
    stock: size.stock ?? 0,
    available: size.available !== false,
  })),
  colors: (product.colors || []).map((color) => ({
    name: color.name,
    // Read `hexCode` too: products saved by the old form stored nothing in
    // `code`, and this is the one chance to repair them on the next save.
    code: color.code || color.hexCode || "#E5E7EB",
    stock: color.stock ?? 0,
    available: color.available !== false,
  })),
  featured: Boolean(product.featured),
  isNewArrival: Boolean(product.isNewArrival),
  isCombo: Boolean(product.isCombo),
  isActive: product.isActive !== false,
})

const VariantRow = ({ children, onRemove, removeLabel }) => (
  <li className="flex items-start gap-2 rounded-card border border-gray-200 bg-gray-50/60 p-3">
    <GripVertical aria-hidden="true" className="mt-2.5 hidden h-4 w-4 shrink-0 text-gray-300 sm:block" />
    <div className="grid min-w-0 flex-1 gap-2.5 sm:grid-cols-[1fr,7rem,auto] sm:items-end">{children}</div>
    <IconButton label={removeLabel} size="sm" variant="danger" className="mt-1" onClick={onRemove}>
      <Trash2 />
    </IconButton>
  </li>
)

const AdminProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const fileInputRef = useRef(null)

  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})

  const sized = isSizedCategory(form.category)

  const loadProduct = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setLoadError(null)

    try {
      const { data } = await productsAPI.getById(id)
      setForm(toForm(data))
      setImages(data.images || [])
    } catch (err) {
      setLoadError(err.response?.data?.message || "Could not load this product.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  const setSpec = (name, value) =>
    setForm((prev) => ({ ...prev, specifications: { ...prev.specifications, [name]: value } }))

  // ---- variants -----------------------------------------------------------

  const addSize = () => {
    const used = form.sizes.map((row) => row.size)
    const next = BANGLE_SIZES.find((option) => !used.includes(option.size))
    if (!next) return

    setField("sizes", [...form.sizes, { ...next, stock: 0, available: true }])
  }

  const updateSize = (index, patch) =>
    setField(
      "sizes",
      form.sizes.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    )

  const addColor = () => {
    const used = form.colors.map((row) => row.name)
    const next = PRODUCT_COLORS.find((option) => !used.includes(option.name))
    if (!next) return

    setField("colors", [...form.colors, { ...next, stock: 0, available: true }])
  }

  const updateColor = (index, patch) =>
    setField(
      "colors",
      form.colors.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    )

  // ---- images -------------------------------------------------------------

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = ""
    if (files.length === 0) return

    setUploading(true)

    // allSettled, not all: one rejected upload used to discard the images that
    // had already succeeded alongside it.
    const results = await Promise.allSettled(files.map((file) => uploadAPI.single(file)))

    const uploaded = results
      .filter((result) => result.status === "fulfilled")
      .map(({ value }) => ({
        url: value.data.imageUrl || value.data.url,
        // The schema field is `public_id`. The upload endpoint answers with
        // `publicId`, so the rename happens here.
        public_id: value.data.publicId || value.data.public_id,
      }))

    const failed = results.length - uploaded.length

    if (uploaded.length > 0) {
      setImages((prev) => [...prev, ...uploaded])
      setErrors((prev) => ({ ...prev, images: undefined }))
    }

    if (failed > 0) {
      toast.error(`${failed} image${failed === 1 ? "" : "s"} failed to upload`, {
        description: "Check the file size and format, then try again.",
      })
    } else {
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} added`)
    }

    setUploading(false)
  }

  const removeImage = async (index) => {
    const image = images[index]
    const publicId = imagePublicId(image)

    // Drop it from the form first — the shop copy is what matters, and a
    // Cloudinary hiccup shouldn't strand an image the admin has removed.
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index))

    if (!publicId) return

    try {
      await uploadAPI.delete(publicId)
    } catch {
      toast.warning("Image removed from the product", {
        description: "It couldn't be deleted from storage, so it may still exist there.",
      })
    }
  }

  const moveImageFirst = (index) =>
    setImages((prev) => {
      const next = [...prev]
      const [image] = next.splice(index, 1)
      return [image, ...next]
    })

  // ---- submit -------------------------------------------------------------

  const validate = () => {
    const next = {}

    if (!form.name.trim()) next.name = "Give the product a name."
    if (!form.description.trim()) next.description = "Shoppers need a description."
    if (!form.price || Number(form.price) <= 0) next.price = "Enter a price above zero."
    if (form.originalPrice && Number(form.originalPrice) <= Number(form.price)) {
      next.originalPrice = "The original price should be higher than the sale price."
    }
    if (images.length === 0) next.images = "Add at least one photo."

    if (sized) {
      if (form.sizes.length === 0) next.sizes = "Bangles need at least one size."
    } else if (form.colors.length === 0 && (form.stock === "" || Number(form.stock) < 0)) {
      next.stock = "Enter the stock quantity."
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validate()) {
      toast.error("Some fields need attention", { description: "The problems are marked in red below." })
      // Let the toast render before yanking focus.
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.focus()
      })
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      category: form.category,
      // Bangles carry their stock per size, colour-tracked products per colour.
      // The flat field stays at 0 for those so the two never disagree.
      stock: sized || form.colors.length > 0 ? 0 : Number(form.stock) || 0,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      specifications: form.specifications,
      images,
      sizes: sized
        ? form.sizes.map((row) => ({
            size: row.size,
            measurement: row.measurement,
            stock: Number(row.stock) || 0,
            available: Boolean(row.available),
          }))
        : [],
      colors: form.colors.map((row) => ({
        name: row.name,
        code: row.code,
        stock: Number(row.stock) || 0,
        available: Boolean(row.available),
      })),
      featured: form.featured,
      isNewArrival: form.isNewArrival,
      isCombo: form.isCombo,
      isActive: form.isActive,
    }

    setSaving(true)

    try {
      if (isEdit) {
        await productsAPI.update(id, payload)
        toast.success("Product updated")
      } else {
        await productsAPI.create(payload)
        toast.success("Product created", { description: "It's live in the shop now." })
      }
      navigate("/admin/products")
    } catch (err) {
      toast.error("Could not save the product", { description: err.response?.data?.message || "Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Discard changes?",
      message: "Anything you've typed since opening this form is lost.",
      confirmLabel: "Discard",
      tone: "danger",
    })
    if (ok) navigate("/admin/products")
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-56" />
        {[0, 1, 2].map((section) => (
          <div key={section} className="space-y-3 rounded-card border border-gray-200 bg-white p-4 sm:p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState title="Product unavailable" description={loadError} onRetry={loadProduct} />
      </div>
    )
  }

  const usedSizes = form.sizes.map((row) => row.size)
  const usedColors = form.colors.map((row) => row.name)
  const discount =
    form.originalPrice && Number(form.originalPrice) > Number(form.price)
      ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)
      : 0

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
      <AdminPageHeader
        title={isEdit ? "Edit product" : "New product"}
        description={isEdit ? form.name || "Update the details below." : "Everything marked * is required."}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="max-sm:hidden"
            >
              Back
            </Button>
            <Button type="submit" loading={saving} loadingText="Saving…" leftIcon={<Save className="h-4 w-4" />}>
              {isEdit ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        <FormSection title="Basics" description="What the product is called and how it's described." icon={Info}>
          <div className="grid gap-4">
            <FormField label="Product name" htmlFor="product-name" required error={errors.name}>
              {(field) => (
                <Input
                  {...field}
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Rose gold bangle set"
                  autoComplete="off"
                />
              )}
            </FormField>

            <FormField
              label="Description"
              htmlFor="product-description"
              required
              error={errors.description}
              hint="Shown on the product page. Mention materials, sizing and care."
            >
              {(field) => (
                <Textarea
                  {...field}
                  rows={5}
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="A set of four hand-finished bangles…"
                />
              )}
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Category" htmlFor="product-category" required>
                {(field) => (
                  <Select
                    {...field}
                    value={form.category}
                    onChange={(event) => setField("category", event.target.value)}
                  >
                    {PRODUCT_CATEGORIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormField
                label="Tags"
                htmlFor="product-tags"
                hint="Comma separated. Used by search."
                error={errors.tags}
              >
                {(field) => (
                  <Input
                    {...field}
                    value={form.tags}
                    onChange={(event) => setField("tags", event.target.value)}
                    placeholder="gift, wedding, gold"
                  />
                )}
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection title="Pricing" description="Set an original price to show a discount badge." icon={Tag}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Price" htmlFor="product-price" required error={errors.price}>
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                  placeholder="0"
                />
              )}
            </FormField>

            <FormField
              label="Original price"
              htmlFor="product-original-price"
              error={errors.originalPrice}
              hint={discount > 0 ? `Shows as ${discount}% off.` : "Optional — leave blank if it isn't on sale."}
            >
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.originalPrice}
                  onChange={(event) => setField("originalPrice", event.target.value)}
                  placeholder="0"
                />
              )}
            </FormField>
          </div>

          {form.price > 0 && (
            <p className="mt-3 text-sm text-gray-600">
              Shoppers see{" "}
              <span className="font-semibold text-gray-900">{formatPrice(Number(form.price))}</span>
              {discount > 0 && (
                <>
                  {" "}
                  with <span className="text-gray-400 line-through">{formatPrice(Number(form.originalPrice))}</span>{" "}
                  struck through.
                </>
              )}
            </p>
          )}
        </FormSection>

        <FormSection
          title="Photos"
          description="The first image is the one shown on cards and in search."
          icon={ImagePlus}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={imagePublicId(image) || image.url || index}
                className="group relative aspect-square overflow-hidden rounded-card border border-gray-200 bg-gray-50"
              >
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={index === 0 ? "Main product photo" : `Product photo ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />

                {index === 0 && (
                  <Badge tone="brand-solid" size="xs" className="absolute left-2 top-2">
                    Main
                  </Badge>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => moveImageFirst(index)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Make main
                    </button>
                  ) : (
                    <span />
                  )}
                  <IconButton
                    label={`Remove photo ${index + 1}`}
                    size="xs"
                    variant="surface"
                    onClick={() => removeImage(index)}
                  >
                    <X />
                  </IconButton>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-describedby={errors.images ? "product-images-error" : undefined}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-gray-300 text-gray-500 transition-colors hover:border-pink-400 hover:bg-pink-50/50 hover:text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-medium">Uploading…</span>
                </>
              ) : (
                <>
                  <ImagePlus aria-hidden="true" className="h-6 w-6" />
                  <span className="text-xs font-medium">Add photos</span>
                </>
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="sr-only"
            tabIndex={-1}
          />

          {errors.images && (
            <p id="product-images-error" role="alert" className="mt-3 text-xs font-medium text-red-600">
              {errors.images}
            </p>
          )}
        </FormSection>

        {sized ? (
          <FormSection
            title="Sizes"
            description="Bangles are sold per size, and each size carries its own stock."
            icon={Ruler}
          >
            {form.sizes.length > 0 && (
              <ul className="mb-3 space-y-2.5">
                {form.sizes.map((row, index) => (
                  <VariantRow
                    key={row.size}
                    removeLabel={`Remove size ${row.size}`}
                    onRemove={() =>
                      setField(
                        "sizes",
                        form.sizes.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                  >
                    <FormField label="Size" htmlFor={`size-${index}`}>
                      {(field) => (
                        <Select
                          {...field}
                          size="sm"
                          value={row.size}
                          onChange={(event) => {
                            const option = BANGLE_SIZES.find((entry) => entry.size === event.target.value)
                            updateSize(index, { size: option.size, measurement: option.measurement })
                          }}
                        >
                          {BANGLE_SIZES.filter((option) => option.size === row.size || !usedSizes.includes(option.size)).map(
                            (option) => (
                              <option key={option.size} value={option.size}>
                                {option.size} — {option.measurement}
                              </option>
                            ),
                          )}
                        </Select>
                      )}
                    </FormField>

                    <FormField label="Stock" htmlFor={`size-stock-${index}`}>
                      {(field) => (
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          size="sm"
                          inputMode="numeric"
                          value={row.stock}
                          onChange={(event) => updateSize(index, { stock: event.target.value })}
                        />
                      )}
                    </FormField>

                    <Checkbox
                      label="On sale"
                      checked={row.available}
                      onChange={(event) => updateSize(index, { available: event.target.checked })}
                      className="sm:pb-2.5"
                    />
                  </VariantRow>
                ))}
              </ul>
            )}

            {errors.sizes && (
              <p role="alert" className="mb-3 text-xs font-medium text-red-600">
                {errors.sizes}
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSize}
              disabled={form.sizes.length >= BANGLE_SIZES.length}
            >
              Add size
            </Button>
          </FormSection>
        ) : (
          <FormSection title="Stock" description="How many units are available to sell." icon={Boxes}>
            <FormField
              label="Quantity"
              htmlFor="product-stock"
              error={errors.stock}
              className="sm:max-w-xs"
              hint={
                form.colors.length > 0
                  ? "Tracked per colour below — this field is ignored."
                  : "Reduced automatically as orders come in."
              }
            >
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  disabled={form.colors.length > 0}
                  value={form.colors.length > 0 ? "" : form.stock}
                  onChange={(event) => setField("stock", event.target.value)}
                  placeholder="0"
                />
              )}
            </FormField>
          </FormSection>
        )}

        <FormSection
          title="Colours"
          description="Optional. Adding colours lets shoppers pick one, and tracks stock per colour."
          icon={Palette}
        >
          {form.colors.length > 0 && (
            <ul className="mb-3 space-y-2.5">
              {form.colors.map((row, index) => (
                <VariantRow
                  key={row.name}
                  removeLabel={`Remove colour ${row.name}`}
                  onRemove={() =>
                    setField(
                      "colors",
                      form.colors.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                >
                  <FormField label="Colour" htmlFor={`color-${index}`}>
                    {(field) => (
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-8 w-8 shrink-0 rounded-lg border border-gray-300"
                          style={{ backgroundColor: swatch(row) }}
                        />
                        <Select
                          {...field}
                          size="sm"
                          value={row.name}
                          onChange={(event) => {
                            const option = PRODUCT_COLORS.find((entry) => entry.name === event.target.value)
                            updateColor(index, { name: option.name, code: option.code })
                          }}
                        >
                          {PRODUCT_COLORS.filter(
                            (option) => option.name === row.name || !usedColors.includes(option.name),
                          ).map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </FormField>

                  <FormField label="Stock" htmlFor={`color-stock-${index}`}>
                    {(field) => (
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        size="sm"
                        inputMode="numeric"
                        value={row.stock}
                        onChange={(event) => updateColor(index, { stock: event.target.value })}
                      />
                    )}
                  </FormField>

                  <Checkbox
                    label="On sale"
                    checked={row.available}
                    onChange={(event) => updateColor(index, { available: event.target.checked })}
                    className="sm:pb-2.5"
                  />
                </VariantRow>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addColor}
            disabled={form.colors.length >= PRODUCT_COLORS.length}
          >
            Add colour
          </Button>
        </FormSection>

        <FormSection title="Specifications" description="Shown as a table on the product page." icon={Info}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Material" htmlFor="spec-material">
              {(field) => (
                <Input
                  {...field}
                  value={form.specifications.material}
                  onChange={(event) => setSpec("material", event.target.value)}
                  placeholder="Gold plated brass"
                />
              )}
            </FormField>

            <FormField label="Colour" htmlFor="spec-color">
              {(field) => (
                <Input
                  {...field}
                  value={form.specifications.color}
                  onChange={(event) => setSpec("color", event.target.value)}
                  placeholder="Rose gold"
                />
              )}
            </FormField>

            <FormField label="Dimensions" htmlFor="spec-dimensions">
              {(field) => (
                <Input
                  {...field}
                  value={form.specifications.dimensions}
                  onChange={(event) => setSpec("dimensions", event.target.value)}
                  placeholder="6 cm diameter"
                />
              )}
            </FormField>

            <FormField label="Weight" htmlFor="spec-weight">
              {(field) => (
                <Input
                  {...field}
                  value={form.specifications.weight}
                  onChange={(event) => setSpec("weight", event.target.value)}
                  placeholder="45 g"
                />
              )}
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Placement" description="Where this product appears around the shop." icon={Sparkles}>
          <div className="space-y-3">
            {PRODUCT_FLAGS.map((flag) => (
              <Checkbox
                key={flag.key}
                label={flag.label}
                hint={flag.hint}
                checked={form[flag.key]}
                onChange={(event) => setField(flag.key, event.target.checked)}
              />
            ))}

            <div className="border-t border-gray-100 pt-3">
              <Checkbox
                label="Visible in the shop"
                hint="Uncheck to retire it. Retired products stay in your order history but can't be bought."
                checked={form.isActive}
                onChange={(event) => setField("isActive", event.target.checked)}
              />
            </div>
          </div>
        </FormSection>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 flex items-center justify-end gap-2.5 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving…" leftIcon={<Save className="h-4 w-4" />}>
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  )
}

export default AdminProductForm
