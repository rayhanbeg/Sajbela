import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { AlertTriangle, Banknote, ImagePlus, Package, ShoppingBag, Users } from "lucide-react"
import { AdminPageHeader, DataTable, MiniBarChart, Panel, StatCard } from "../../components/admin"
import { Badge, Button, EmptyState, ErrorState, Image } from "../../components/ui"
import { ordersAPI, productsAPI, usersAPI } from "../../lib/api"
import { orderCustomer, orderNumber, statusMeta } from "../../lib/orders"
import { LOW_STOCK_THRESHOLD, productImage, stockLevel, stockTone } from "../../lib/products"
import { formatDate, formatPrice } from "../../lib/utils"

/**
 * Admin overview.
 *
 * The figures here used to be computed in the browser: the page fetched the
 * 1000 newest products and the 1000 newest orders and reduced over them, so
 * "Total Revenue" was really "revenue from the most recent page of orders" and
 * the product count was capped at the fetch limit. It also dispatched the
 * shopper's `fetchProducts` thunk, which wrote the whole catalogue into the
 * Redux slice the storefront reads.
 *
 * Now every number comes from `GET /orders/stats` (three Mongo aggregations
 * over the full collections) plus two small, purpose-built list requests. The
 * four requests are independent, so they run through `Promise.allSettled` and
 * each card fails on its own rather than blanking the page.
 */

const RANGE_DAYS = 14

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [customerCount, setCustomerCount] = useState(null)
  const [productCount, setProductCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [statsResult, ordersResult, productsResult, usersResult] = await Promise.allSettled([
      ordersAPI.getStats({ days: RANGE_DAYS }),
      ordersAPI.getAll({ limit: 5 }),
      // "stock-low" sorts by the plain stock field, which is the only one Mongo
      // can sort on — variant totals are summed client-side below.
      productsAPI.getAdminList({ limit: 8, sort: "stock-low", status: "active" }),
      usersAPI.getAll({ limit: 1 }),
    ])

    if (statsResult.status === "fulfilled") {
      setStats(statsResult.value.data)
    } else {
      setError(statsResult.reason?.response?.data?.message || "Could not load the dashboard figures.")
    }

    if (ordersResult.status === "fulfilled") setRecentOrders(ordersResult.value.data.orders || [])

    if (productsResult.status === "fulfilled") {
      const products = productsResult.value.data.products || []
      setProductCount(productsResult.value.data.pagination?.total ?? null)
      setLowStock(products.filter((product) => stockLevel(product).total <= LOW_STOCK_THRESHOLD).slice(0, 5))
    }

    if (usersResult.status === "fulfilled") setCustomerCount(usersResult.value.data.pagination?.total ?? null)

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pending = (stats?.statusCounts?.pending || 0) + (stats?.statusCounts?.processing || 0)

  const chartData = (stats?.series || []).map((point) => ({
    label: new Date(point.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    value: point.revenue,
    title: `${point.orders} order${point.orders === 1 ? "" : "s"}`,
  }))

  const orderColumns = [
    {
      key: "order",
      header: "Order",
      card: "title",
      cell: (order) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{orderNumber(order._id)}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{orderCustomer(order).name}</p>
        </div>
      ),
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
      key: "date",
      header: "Placed",
      cardLabel: "Placed",
      cellClass: "text-gray-500",
      cell: (order) => formatDate(order.createdAt),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cardLabel: "Total",
      cellClass: "font-medium tabular-nums text-gray-900",
      cell: (order) => formatPrice(order.totalPrice),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        description={user?.name ? `Welcome back, ${user.name}.` : "Your shop at a glance."}
        actions={
          <Button to="/admin/products/new" leftIcon={<ImagePlus className="h-4 w-4" />}>
            Add product
          </Button>
        }
      />

      {error && (
        <Panel>
          <ErrorState title="Dashboard unavailable" description={error} onRetry={load} size="sm" />
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(stats?.totalRevenue || 0)}
          hint="Excludes cancelled orders"
          icon={Banknote}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Orders"
          value={stats?.totalOrders ?? 0}
          hint={pending > 0 ? `${pending} awaiting dispatch` : "All caught up"}
          icon={ShoppingBag}
          tone="brand"
          loading={loading}
          to="/admin/orders"
        />
        <StatCard
          label="Products"
          value={productCount ?? "—"}
          hint={lowStock.length > 0 ? `${lowStock.length} running low` : "Stock looks healthy"}
          icon={Package}
          tone="info"
          loading={loading}
          to="/admin/products"
        />
        <StatCard
          label="Customers"
          value={customerCount ?? "—"}
          hint="Registered accounts"
          icon={Users}
          tone="neutral"
          loading={loading}
          to="/admin/users"
        />
      </div>

      <Panel
        title="Revenue"
        description={`Daily takings over the last ${stats?.days || RANGE_DAYS} days.`}
        actions={
          <Link to="/admin/orders" className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline">
            All orders
          </Link>
        }
      >
        <MiniBarChart
          data={chartData}
          ariaLabel={`Revenue per day over the last ${stats?.days || RANGE_DAYS} days`}
          formatValue={formatPrice}
          emptyMessage={loading ? "Loading…" : "No orders in this period yet."}
        />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Recent orders"
          description="The five most recent, newest first."
          bodyClassName="p-0 sm:p-0"
          actions={
            <Link to="/admin/orders" className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline">
              View all
            </Link>
          }
        >
          <DataTable
            columns={orderColumns}
            rows={recentOrders}
            rowKey={(order) => order._id}
            loading={loading}
            skeletonRows={5}
            caption="Five most recent orders"
            empty={
              <EmptyState
                icon={<ShoppingBag />}
                title="No orders yet"
                description="Orders will appear here as soon as the first one is placed."
                size="sm"
              />
            }
          />
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Low stock"
          description={`At or below ${LOW_STOCK_THRESHOLD} units.`}
          bodyClassName="p-0 sm:p-0"
        >
          {loading ? (
            <ul className="divide-y divide-gray-100">
              {[0, 1, 2].map((row) => (
                <li key={row} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : lowStock.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                icon={<Package />}
                title="Nothing running low"
                description={`Every active product has more than ${LOW_STOCK_THRESHOLD} units in stock.`}
                size="sm"
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lowStock.map((product) => {
                const { total } = stockLevel(product)

                return (
                  <li key={product._id}>
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none sm:px-5"
                    >
                      <Image
                        src={productImage(product)}
                        alt=""
                        aspect="square"
                        width={120}
                        sizes="44px"
                        className="h-11 w-11 shrink-0"
                        rounded="rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{formatPrice(product.price)}</p>
                      </div>
                      <Badge tone={stockTone(total)} size="sm" icon={total <= 0 ? <AlertTriangle /> : undefined}>
                        {total <= 0 ? "Out" : `${total} left`}
                      </Badge>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

export default AdminDashboard
