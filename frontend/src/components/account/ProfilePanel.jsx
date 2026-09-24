import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BadgeCheck, KeyRound, Mail, PenLine, Phone, ShieldCheck, User } from "lucide-react"
import { Badge, Button, FormField, Input, useToast } from "../ui"
import { updateUserProfile } from "../../lib/store/authSlice"
import { formatDate, validatePhone } from "../../lib/utils"

/**
 * Name / email / phone, read-only until you ask to edit.
 *
 * The old version put the page into edit mode with an "Edit" button that
 * doubled as "Cancel", dispatched the update without awaiting it and closed the
 * form immediately — so a failed save looked exactly like a successful one.
 * Now the button waits for the request and reports what happened.
 */

const ROWS = [
  { key: "name", label: "Full name", icon: User, autoComplete: "name", placeholder: "Your name" },
  { key: "email", label: "Email address", icon: Mail, autoComplete: "email", type: "email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone number", icon: Phone, autoComplete: "tel", type: "tel", placeholder: "01XXXXXXXXX" },
]

function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = "Enter your name"
  else if (form.name.trim().length < 2) errors.name = "That name looks too short"

  if (!form.email.trim()) errors.email = "Enter your email address"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address"

  // Phone is optional on Google accounts — Google doesn't give us one — but if
  // there's something in the box it has to be a real number.
  if (form.phone.trim() && !validatePhone(form.phone)) {
    errors.phone = "Enter an 11-digit number starting with 01"
  }

  return errors
}

const ProfilePanel = () => {
  const dispatch = useDispatch()
  const toast = useToast()
  const { user } = useSelector((state) => state.auth)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const firstFieldRef = useRef(null)

  // Re-seed whenever the account data lands (App fetches the profile on load,
  // so the first paint can be from the cached copy).
  useEffect(() => {
    setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" })
  }, [user])

  const isGoogle = user?.authProvider === "google"

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const startEditing = () => {
    setErrors({})
    setEditing(true)
    // The field doesn't exist until this render commits.
    requestAnimationFrame(() => firstFieldRef.current?.focus())
  }

  const cancelEditing = () => {
    setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" })
    setErrors({})
    setEditing(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = validate(form)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      document.getElementById(`profile-${Object.keys(found)[0]}`)?.focus()
      return
    }

    setSaving(true)
    try {
      await dispatch(
        updateUserProfile({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      ).unwrap()

      toast.success("Profile updated")
      setEditing(false)
    } catch (error) {
      toast.error("Couldn't save your profile", { description: error || "Please try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Personal details</h2>
          <p className="mt-0.5 text-sm text-gray-600">We use these to confirm orders and arrange delivery.</p>
        </div>

        {!editing && (
          <Button
            variant="outline"
            size="md"
            className="shrink-0"
            leftIcon={<PenLine className="h-4 w-4" />}
            onClick={startEditing}
          >
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {ROWS.map((row, index) => (
            <FormField
              key={row.key}
              label={row.label}
              required={row.key !== "phone"}
              error={errors[row.key]}
              hint={row.key === "phone" ? "The courier calls this number before delivery." : undefined}
              htmlFor={`profile-${row.key}`}
            >
              {(field) => (
                <Input
                  {...field}
                  ref={index === 0 ? firstFieldRef : undefined}
                  size="lg"
                  type={row.type}
                  name={row.key}
                  autoComplete={row.autoComplete}
                  placeholder={row.placeholder}
                  inputMode={row.key === "phone" ? "numeric" : undefined}
                  maxLength={row.key === "phone" ? 11 : undefined}
                  value={form[row.key]}
                  onChange={(e) =>
                    setField(row.key, row.key === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value)
                  }
                />
              )}
            </FormField>
          ))}

          <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row">
            <Button type="button" variant="outline" disabled={saving} onClick={cancelEditing}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} loadingText="Saving…">
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        <dl className="divide-y divide-gray-100 rounded-card border border-gray-200 bg-white">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-start gap-3 p-4">
              <row.icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{row.label}</dt>
                <dd className="mt-0.5 break-words text-sm text-gray-900">
                  {user?.[row.key] || <span className="text-gray-400">Not provided</span>}
                </dd>
              </div>
            </div>
          ))}

          {user?.createdAt && (
            <div className="flex items-start gap-3 p-4">
              <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Member since</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
              </div>
            </div>
          )}
        </dl>
      )}

      <div className="mt-6 rounded-card border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            {isGoogle ? (
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <KeyRound aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isGoogle ? "Signed in with Google" : "Password"}
              </h3>
              <p className="mt-0.5 text-sm text-gray-600">
                {isGoogle
                  ? "Google handles your sign-in, so there's no password to manage here."
                  : "Send yourself a reset link to choose a new one."}
              </p>
            </div>
          </div>

          {isGoogle ? (
            <Badge tone="success" size="md">
              Secured by Google
            </Badge>
          ) : (
            <Button variant="outline" size="sm" to="/auth/forgot-password" className="shrink-0">
              Change password
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePanel
