import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Mail, Search, Shield, ShieldCheck, Trash2, UserCog, Users } from "lucide-react"
import { AdminPageHeader, DataTable, Panel } from "../../components/admin"
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
  useConfirm,
  useToast,
} from "../../components/ui"
import { usersAPI } from "../../lib/api"
import { formatDate } from "../../lib/utils"

/**
 * Admin customers.
 *
 * The Active/Inactive column and its toggle are gone. They were never real:
 * `User` has no `isActive` field and `routes/users.js` has no
 * `PUT /:id/status`, so the badge read "Inactive" for every account that had
 * ever existed and the button behind it could only 404. The summary panel then
 * counted those imaginary flags and reported every customer as inactive.
 *
 * What replaces it is the endpoint that was already there and unused —
 * `DELETE /users/:userId`, behind a confirm dialog. The server refuses to
 * delete the calling admin, and the row hides the action for your own account
 * so you don't discover that by clicking.
 */

const PAGE_SIZE = 10

const initials = (name) => (name || "?").trim().charAt(0).toUpperCase()

const AdminUsers = () => {
  const toast = useToast()
  const confirm = useConfirm()
  const { user: currentUser } = useSelector((state) => state.auth)

  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState("")
  const [search, setSearch] = useState("")
  const [searchDraft, setSearchDraft] = useState("")
  // Ids with a role change or delete in flight, so their row buttons disable.
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
      const { data } = await usersAPI.getAll({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
      })
      setUsers(data.users || [])
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || "Could not load customers.")
    } finally {
      setLoading(false)
    }
  }, [page, search, role])

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

  const handleRoleChange = (target) => {
    const nextRole = target.role === "admin" ? "user" : "admin"

    return withBusy(target._id, async () => {
      const ok = await confirm({
        title: nextRole === "admin" ? `Make ${target.name} an admin?` : `Remove admin access from ${target.name}?`,
        message:
          nextRole === "admin"
            ? "Admins can add and delete products, see every order, and change other people's roles."
            : "They'll keep their account and order history but lose access to this panel.",
        confirmLabel: nextRole === "admin" ? "Make admin" : "Remove access",
        tone: nextRole === "admin" ? "brand" : "danger",
      })
      if (!ok) return

      try {
        await usersAPI.updateRole(target._id, nextRole)
        setUsers((prev) => prev.map((row) => (row._id === target._id ? { ...row, role: nextRole } : row)))
        toast.success(nextRole === "admin" ? "Admin access granted" : "Admin access removed")
      } catch (err) {
        toast.error("Could not change the role", { description: err.response?.data?.message || "Please try again." })
      }
    })
  }

  const handleDelete = (target) =>
    withBusy(target._id, async () => {
      const ok = await confirm({
        title: `Delete ${target.name}?`,
        message: "Their account is removed permanently. Orders they've already placed stay in your records.",
        confirmLabel: "Delete account",
        tone: "danger",
      })
      if (!ok) return

      try {
        await usersAPI.delete(target._id)
        toast.success("Customer deleted")
        // Refetch rather than splice: the page is now one short, and on the
        // last page removing the only row should step back a page.
        if (users.length === 1 && page > 1) setPage(page - 1)
        else load()
      } catch (err) {
        toast.error("Could not delete the account", {
          description: err.response?.data?.message || "Please try again.",
        })
      }
    })

  const columns = [
    {
      key: "user",
      header: "Customer",
      card: "title",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-100 text-sm font-semibold text-pink-700"
          >
            {initials(row.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{row.name}</p>
            <p className="truncate text-xs text-gray-500 lg:hidden">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cardLabel: "Email",
      card: "hidden",
      cell: (row) => (
        <a href={`mailto:${row.email}`} className="break-all text-gray-700 hover:text-pink-600 hover:underline">
          {row.email}
        </a>
      ),
    },
    {
      key: "role",
      header: "Role",
      card: "meta",
      cell: (row) =>
        row.role === "admin" ? (
          <Badge tone="admin" size="sm" icon={<ShieldCheck />}>
            Admin
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            Customer
          </Badge>
        ),
    },
    {
      key: "joined",
      header: "Joined",
      cardLabel: "Joined",
      cellClass: "whitespace-nowrap text-gray-500",
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      card: "actions",
      cell: (row) => {
        const isSelf = row._id === currentUser?._id
        const busy = busyIds.includes(row._id)

        if (isSelf) {
          return (
            <span className="text-xs text-gray-500 max-lg:block max-lg:text-center">This is you</span>
          )
        }

        return (
          <div className="flex items-center justify-end gap-1 max-lg:justify-center">
            <IconButton
              label={row.role === "admin" ? `Remove admin access from ${row.name}` : `Make ${row.name} an admin`}
              size="sm"
              variant={row.role === "admin" ? "ghost-brand" : "ghost"}
              disabled={busy}
              onClick={() => handleRoleChange(row)}
            >
              {row.role === "admin" ? <UserCog /> : <Shield />}
            </IconButton>
            <IconButton
              label={`Delete ${row.name}`}
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => handleDelete(row)}
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
        title="Customers"
        description={
          loading ? "Loading customers…" : `${pagination.total} account${pagination.total === 1 ? "" : "s"}.`
        }
      />

      <Panel bodyClassName="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Search" htmlFor="user-search" className="sm:col-span-2">
            {(field) => (
              <Input
                {...field}
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Name or email"
                leftIcon={<Search />}
              />
            )}
          </FormField>

          <FormField label="Role" htmlFor="user-role">
            {(field) => (
              <Select
                {...field}
                value={role}
                onChange={(event) => {
                  setRole(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Everyone</option>
                <option value="user">Customers</option>
                <option value="admin">Admins</option>
              </Select>
            )}
          </FormField>
        </div>
      </Panel>

      {error ? (
        <Panel>
          <ErrorState title="Customers unavailable" description={error} onRetry={load} size="sm" />
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
            rows={users}
            rowKey={(row) => row._id}
            loading={loading}
            skeletonRows={PAGE_SIZE}
            caption="Registered customers"
            empty={
              <EmptyState
                icon={<Users />}
                title={search || role ? "No customers match" : "No customers yet"}
                description={
                  search || role
                    ? "Try a different name, email, or role."
                    : "Accounts appear here as people sign up."
                }
                size="sm"
                action={
                  search || role ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearchDraft("")
                        setRole("")
                        setPage(1)
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            }
          />
        </Panel>
      )}

      <Panel title="About roles" bodyClassName="p-4 sm:p-5">
        <ul className="space-y-1.5 text-sm text-gray-600">
          <li className="flex gap-2">
            <Shield aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            Admins can add and delete products, see every order, and change other people's roles.
          </li>
          <li className="flex gap-2">
            <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            Customers only see their own account, orders and addresses.
          </li>
          <li className="flex gap-2">
            <UserCog aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            You can't change your own role or delete your own account from here.
          </li>
        </ul>
      </Panel>
    </div>
  )
}

export default AdminUsers
