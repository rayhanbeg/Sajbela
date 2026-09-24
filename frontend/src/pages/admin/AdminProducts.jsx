import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Eye, EyeOff, Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { AdminPageHeader, DataTable, Panel } from "../../components/admin"
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Image,
  Input,
  Pagination,
  Select,
  useConfirm,
  useToast,
} from "../../components/ui"
import { productsAPI } from "../../lib/api"
import {
  PRODUCT_CATEGORIES,
  categoryLabel,
  productFlags,
  productImage,
  stockLevel,
  stockStatusLabel,
  stockTone,
  variantSummary,
} from "../../lib/products"
import { formatPrice } from "../../lib/utils"

/**
 * Admin catalogue.
 *
 * This page used to dispatch the shopper's `fetchProducts` thunk with
 * `limit: 1000` and then search, filter, sort and paginate the result in the
 * browser. That wrote the entire catalogue into the Redux slice the storefront
 * reads — so visiting the admin list and going back to /shop showed every
 * product on one page — and because the shop query hides retired products,
 * there was no way to see or restore one from here.
 *
 * It now talks to `GET /products/admin/list`, which does the same filtering in
 * Mongo and includes retired products.
 */

const PAGE_SIZE = 20

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "price-high", label: "Price: high to low" },
  { value: "price-low", label: "Price: low to high" },
  { value: "stock-low", label: "Stock: lowest first" },
]

const AdminProducts = () => {
  const toast = useToast()
  const confirm = useConfirm()

  const [products, setProducts] = useState([])
  const [categoryCounts, setCategoryCounts] = useState({})
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchDraft, setSearchDraft] = useState("")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("")
  const [sort, setSort] = useState("newest")
  const [busyIds, setBusyIds] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchDraft)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchDraft])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await productsAPI.getAdminList({
        page,
        limit: PAGE_SIZE,
        sort,
        ...(search ? { search } : {}),
        ...(category !== "all" ? { category } : {}),
        ...(status ? { status } : {}),
      })
      setProducts(data.products || [])
      setCategoryCounts(data.categoryCounts || {})
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the catalogue.")
    } finally {
      setLoading(false)
    }
  }, [page, search, category, status, sort])

  useEffect(() => {
    load()
  }, [load])

  const withBusy = async (id, work) => {
    setBusyIds((prev) => [...prev, id])
    try {
      await work()
    } finally {
      setBusyIds((prev) => prev.filter((busy) => busy !== id))
    }
  }

  /*
   * Retiring is the soft alternative to deleting. Orders reference products by
   * id, so deleting one that has been sold leaves those order lines pointing at
   * nothing — retiring hides it from the shop and keeps the history intact.
   */
  const handleToggleActive = (product) => {
    const nextActive = product.isActive === false

    return withBusy(product._id, async () => {
      if (!nextActive) {
        const ok = await confirm({
          title: `Retire ${product.name}?`,
          message: "It disappears from the shop and search straight away. You can bring it back at any time.",
          confirmLabel: "Retire product",
          tone: "warning",
        })
        if (!ok) return
      }

      try {
        await productsAPI.update(product._id, { isActive: nextActive })
        setProducts((prev) => prev.map((row) => (row._id === product._id ? { ...row, isActive: nextActive } : row)))
        toast.success(nextActive ? "Product is live again" : "Product retired")
      } catch (err) {
        toast.error("Could not change visibility", { description: err.response?.data?.message || "Please try again." })
      }
    })
  }

  const handleDelete = (product) =>
    withBusy(product._id, async () => {
      const ok = await confirm({
        title: `Delete ${product.name}?`,
        message:
          "This removes it permanently. If it has ever been ordered, retire it instead so the order history stays readable.",
        confirmLabel: "Delete forever",
        tone: "danger",
      })
      if (!ok) return

      try {
        await productsAPI.delete(product._id)
        toast.success("Product deleted")
        if (products.length === 1 && page > 1) setPage(page - 1)
        else load()
      } catch (err) {
        toast.error("Could not delete the product", {
          description: err.response?.data?.message || "Please try again.",
        })
      }
    })

  const resetFilters = () => {
    setSearchDraft("")
    setCategory("all")
    setStatus("")
    setSort("newest")
    setPage(1)
  }

  const filtered = Boolean(search || category !== "all" || status)

  const columns = [
    {
      key: "product",
      header: "Product",
      card: "title",
      cell: (product) => {
        const flags = productFlags(product)

        return (
          <div className="flex items-start gap-3">
            <Image
              src={productImage(product)}
              alt=""
              aspect="square"
              width={120}
              sizes="48px"
              className="h-12 w-12 shrink-0"
              rounded="rounded-lg"
            />
            <div className="min-w-0">
              <Link
                to={`/admin/products/${product._id}/edit`}
                className="line-clamp-2 font-medium text-gray-900 hover:text-pink-600 hover:underline"
              >
                {product.name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-500">{categoryLabel(product.category)}</span>
                {flags.map((flag) => (
                  <Badge key={flag.key} tone={flag.tone} size="xs">
                    {flag.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      cardLabel: "Price",
      cellClass: "whitespace-nowrap",
      cell: (product) => (
        <div>
          <span className="font-medium tabular-nums text-gray-900">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="ml-1.5 text-xs tabular-nums text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cardLabel: "Stock",
      cell: (product) => {
        const { total } = stockLevel(product)
        const variants = variantSummary(product)

        return (
          <div className="flex flex-col items-end gap-0.5">
            <Badge tone={stockTone(total)} size="sm">
              {stockStatusLabel(total)}
            </Badge>
            {variants && <span className="text-xs text-gray-400">{variants}</span>}
          </div>
        )
      },
    },
    {
      key: "visibility",
      header: "Status",
      card: "meta",
      cell: (product) =>
        product.isActive === false ? (
          <Badge tone="neutral" size="sm" icon={<EyeOff />}>
            Retired
          </Badge>
        ) : (
          <Badge tone="success" size="sm" dot>
            Live
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      card: "actions",
      cell: (product) => {
        const busy = busyIds.includes(product._id)
        const retired = product.isActive === false

        return (
          <div className="flex items-center justify-end gap-1 max-lg:justify-center">
            <IconButton label={`Edit ${product.name}`} size="sm" to={`/admin/products/${product._id}/edit`}>
              <Pencil />
            </IconButton>
            <IconButton
              label={retired ? `Put ${product.name} back in the shop` : `Retire ${product.name}`}
              size="sm"
              variant={retired ? "ghost-brand" : "ghost"}
              disabled={busy}
              onClick={() => handleToggleActive(product)}
            >
              {retired ? <Eye /> : <EyeOff />}
            </IconButton>
            <IconButton
              label={`Delete ${product.name}`}
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => handleDelete(product)}
            >
              <Trash2 />
            </IconButton>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description={loading ? "Loading catalogue…" : `${pagination.total} product${pagination.total === 1 ? "" : "s"}.`}
        actions={
          <Button to="/admin/products/new" leftIcon={<Plus className="h-4 w-4" />}>
            Add product
          </Button>
        }
      />

      <Panel bodyClassName="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Search" htmlFor="product-search" className="lg:col-span-2">
            {(field) => (
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <Input
                  {...field}
                  type="search"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Name, description or tag"
                  className="pl-9"
                />
              </div>
            )}
          </FormField>

          <FormField label="Visibility" htmlFor="product-status">
            {(field) => (
              <Select
                {...field}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">All products</option>
                <option value="active">Live only</option>
                <option value="retired">Retired only</option>
              </Select>
            )}
          </FormField>

          <FormField label="Sort" htmlFor="product-sort">
            {(field) => (
              <Select
                {...field}
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value)
                  setPage(1)
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>

        <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {[{ value: "all", label: "All" }, ...PRODUCT_CATEGORIES].map((option) => {
            const active = category === option.value
            const count = option.value === "all" ? null : categoryCounts[option.value]

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCategory(option.value)
                  setPage(1)
                }}
                className={`shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${
                  active
                    ? "border-pink-600 bg-pink-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
                {count > 0 && <span className={active ? "ml-1.5 text-pink-100" : "ml-1.5 text-gray-400"}>{count}</span>}
              </button>
            )
          })}
        </div>
      </Panel>

      {error ? (
        <Panel>
          <ErrorState title="Catalogue unavailable" description={error} onRetry={load} size="sm" />
        </Panel>
      ) : (
        <Panel
          bodyClassName="p-0 sm:p-0"
          footer={
            pagination.totalPages > 1 ? (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            ) : null
          }
        >
          <DataTable
            columns={columns}
            rows={products}
            rowKey={(product) => product._id}
            loading={loading}
            skeletonRows={8}
            caption="Product catalogue"
            empty={
              <EmptyState
                icon={<Package />}
                title={filtered ? "No products match" : "Your catalogue is empty"}
                description={
                  filtered
                    ? "Try a different search term, category, or visibility."
                    : "Add your first product and it will appear in the shop straight away."
                }
                size="sm"
                action={
                  filtered ? (
                    <Button variant="secondary" onClick={resetFilters}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button to="/admin/products/new" leftIcon={<Plus className="h-4 w-4" />}>
                      Add product
                    </Button>
                  )
                }
              />
            }
          />
        </Panel>
      )}
    </div>
  )
}

export default AdminProducts
