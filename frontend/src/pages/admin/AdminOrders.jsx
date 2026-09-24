import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarDays, Eye, RefreshCw, Search, ShoppingBag, X } from "lucide-react"
import { AdminPageHeader, DataTable, OrderDetail, Panel } from "../../components/admin"
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Input,
  Pagination,
  Select,
  useToast,
} from "../../components/ui"
import { ordersAPI } from "../../lib/api"
import { ORDER_STATUSES, orderCustomer, orderItemCount, orderNumber, paymentLabel, statusMeta } from "../../lib/orders"
import { formatDate, formatPrice } from "../../lib/utils"

/**
 * Admin orders.
 *
 * Two things were broken here beyond the styling. Every row read
 * `order.orderStatus`, a field the Order model doesn't have — the real one is
 * `status` — so each badge said "undefined" and the three summary counters were
 * permanently zero. And pagination read `response.data.totalPages` /
 * `.totalOrders`, which the controller nests under `pagination`, so the pager
 * never appeared no matter how many orders existed.
 *
 * The per-row status `<select>` is gone too: it fired on `change`, so a stray
 * scroll over a focused dropdown silently marked an order delivered. Status now
 * lives in the detail modal behind an explicit save.
 */

const PAGE_SIZE = 10

const EMPTY_FILTERS = { status: "", search: "", startDate: "", endDate: "" }

const AdminOrders = () => {
  const toast = useToast()

  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  // `search` is debounced into `filters.search`; this is the live input value.
  const [searchDraft, setSearchDraft] = useState("")
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === searchDraft ? prev : { ...prev, search: searchDraft }))
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchDraft])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = { page, limit: PAGE_SIZE }
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value
      })

      const { data } = await ordersAPI.getAll(params)
      setOrders(data.orders || [])
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || "Could not load orders.")
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (orderId, status) => {
    try {
      const { data } = await ordersAPI.updateStatus(orderId, status)
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, ...data } : order)))
      setSelected(null)
      toast.success("Order updated", { description: `Marked as ${statusMeta(status).label.toLowerCase()}.` })
    } catch (err) {
      toast.error("Could not update the order", { description: err.response?.data?.message || "Please try again." })
    }
  }

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setSearchDraft("")
    setPage(1)
  }

  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters])

  const columns = [
    {
      key: "order",
      header: "Order",
      card: "title",
      cell: (order) => {
        const customer = orderCustomer(order)

        return (
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{orderNumber(order._id)}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {customer.name}
              {customer.guest && " · guest"}
            </p>
          </div>
        )
      },
    },
    {
      key: "contact",
      header: "Phone",
      cardLabel: "Phone",
      cell: (order) => {
        const phone = orderCustomer(order).phone
        if (!phone) return <span className="text-gray-400">—</span>
        return (
          <a href={`tel:${phone}`} className="tabular-nums text-gray-700 hover:text-pink-600 hover:underline">
            {phone}
          </a>
        )
      },
    },
    {
      key: "date",
      header: "Placed",
      cardLabel: "Placed",
      cellClass: "whitespace-nowrap text-gray-500",
      cell: (order) => formatDate(order.createdAt),
    },
    {
      key: "items",
      header: "Items",
      align: "center",
      cardLabel: "Items",
      cellClass: "tabular-nums text-gray-500",
      cell: (order) => orderItemCount(order),
    },
    {
      key: "payment",
      header: "Payment",
      cardLabel: "Payment",
      cellClass: "text-gray-500",
      cell: (order) => paymentLabel(order.paymentMethod),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cardLabel: "Total",
      cellClass: "whitespace-nowrap font-medium tabular-nums text-gray-900",
      cell: (order) => formatPrice(order.totalPrice),
    },
    {
      key: "status",
      header: "Status",
      card: "meta",
      cell: (order) => {
        const meta = statusMeta(order.status)
        return (
          <Badge tone={meta.tone} size="sm" dot>
            {meta.label}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      card: "actions",
      cell: (order) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="h-4 w-4" />}
          onClick={() => setSelected(order)}
          className="max-lg:w-full"
        >
          Details
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description={
          loading
            ? "Loading orders…"
            : `${pagination.total} order${pagination.total === 1 ? "" : "s"}${
                activeFilterCount > 0 ? " matching these filters" : " in total"
              }.`
        }
        actions={
          <Button
            variant="outline"
            onClick={load}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            aria-label="Refresh orders"
          >
            Refresh
          </Button>
        }
      />

      <Panel bodyClassName="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Search" htmlFor="order-search" className="sm:col-span-2 lg:col-span-1">
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
                  placeholder="Name or phone"
                  className="pl-9"
                />
              </div>
            )}
          </FormField>

          <FormField label="Status" htmlFor="order-status-filter">
            {(field) => (
              <Select {...field} value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusMeta(value).label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="From" htmlFor="order-start">
            {(field) => (
              <Input
                {...field}
                type="date"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={(event) => setFilter("startDate", event.target.value)}
              />
            )}
          </FormField>

          <FormField label="To" htmlFor="order-end">
            {(field) => (
              <Input
                {...field}
                type="date"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={(event) => setFilter("endDate", event.target.value)}
              />
            )}
          </FormField>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <Badge tone="brand" size="sm" icon={<CalendarDays />}>
              {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active
            </Badge>
            <IconButton label="Clear all filters" size="sm" variant="ghost" onClick={clearFilters}>
              <X />
            </IconButton>
          </div>
        )}
      </Panel>

      {error ? (
        <Panel>
          <ErrorState title="Orders unavailable" description={error} onRetry={load} size="sm" />
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
            rows={orders}
            rowKey={(order) => order._id}
            loading={loading}
            skeletonRows={PAGE_SIZE}
            caption="Customer orders"
            empty={
              <EmptyState
                icon={<ShoppingBag />}
                title={activeFilterCount > 0 ? "No orders match these filters" : "No orders yet"}
                description={
                  activeFilterCount > 0
                    ? "Try widening the date range or clearing the search."
                    : "Orders will appear here as soon as the first one is placed."
                }
                size="sm"
                action={
                  activeFilterCount > 0 ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            }
          />
        </Panel>
      )}

      {selected && (
        <OrderDetail order={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}

export default AdminOrders
