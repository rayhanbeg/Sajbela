import { useCallback, useEffect, useState } from "react"
import { Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge, Button, EmptyState, ErrorState, Skeleton, useConfirm, useToast } from "../ui"
import AddressForm from "../AddressForm"
import { addressesAPI } from "../../lib/api"
import { addressLines } from "../../lib/orders"

/**
 * Saved delivery addresses.
 *
 * The cards used to print `address.city, address.state address.postalCode` —
 * three fields the Address model has never had. Every saved address rendered a
 * line reading ", " under the street. They now show district and thana, which
 * is what's actually stored and what the courier needs.
 *
 * Fetching lives here rather than in the page: the panel only mounts when its
 * tab is open, so visiting /account to check an order no longer fires an
 * addresses request nobody asked for.
 */

const AddressSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading your addresses">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="space-y-3 rounded-card border border-gray-200 bg-white p-4">
        <Skeleton className="h-4 w-1/3" rounded="rounded" />
        <Skeleton className="h-3 w-full" rounded="rounded" />
        <Skeleton className="h-3 w-2/3" rounded="rounded" />
        <Skeleton className="h-3 w-1/2" rounded="rounded" />
      </div>
    ))}
  </div>
)

const AddressesPanel = () => {
  const toast = useToast()
  const confirm = useConfirm()

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {…} = edit
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await addressesAPI.getAll()
      setAddresses(Array.isArray(response.data) ? response.data : [])
    } catch (requestError) {
      console.error("Error fetching addresses:", requestError)
      setError(requestError.response?.data?.message || "Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (address) => {
    const ok = await confirm({
      title: "Delete this address?",
      message: `${address.fullName} — ${address.address}. You can always add it again.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: () => addressesAPI.delete(address._id),
    })

    if (!ok) return

    toast.success("Address deleted")
    load()
  }

  const handleSetDefault = async (address) => {
    setBusyId(address._id)

    try {
      await addressesAPI.setDefault(address._id)
      toast.success("Default address updated")
      await load()
    } catch (requestError) {
      console.error("Error setting default address:", requestError)
      toast.error("Couldn't update the default address", {
        description: requestError.response?.data?.message || "Please try again.",
      })
    } finally {
      setBusyId(null)
    }
  }

  const addButton = (
    <Button size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing({})}>
      Add address
    </Button>
  )

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Saved addresses</h2>
          <p className="mt-0.5 text-sm text-gray-600">Checkout fills in your default address automatically.</p>
        </div>
        {addresses.length > 0 && <div className="shrink-0">{addButton}</div>}
      </div>

      {loading ? (
        <AddressSkeleton />
      ) : error ? (
        <ErrorState title="We couldn't load your addresses" description={error} onRetry={load} />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="No saved addresses"
          description="Save an address once and checkout becomes a two-tap job."
          action={addButton}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address._id}>
              <article
                className={
                  address.isDefault
                    ? "flex h-full flex-col rounded-card border-2 border-pink-200 bg-pink-50/40 p-4"
                    : "flex h-full flex-col rounded-card border border-gray-200 bg-white p-4"
                }
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
                  {address.isDefault && (
                    <Badge tone="brand" size="sm">
                      Default
                    </Badge>
                  )}
                </div>

                <div className="flex-1 text-sm leading-relaxed text-gray-600">
                  {addressLines(address).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <p className="mt-1.5 text-gray-700">{address.phone}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-200/70 pt-3">
                  {!address.isDefault && (
                    <Button
                      variant="ghost-brand"
                      size="xs"
                      loading={busyId === address._id}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                      onClick={() => handleSetDefault(address)}
                    >
                      Set as default
                    </Button>
                  )}

                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => setEditing(address)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-red-600 hover:bg-red-50"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDelete(address)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <AddressForm
          address={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={() => load()}
        />
      )}
    </>
  )
}

export default AddressesPanel
