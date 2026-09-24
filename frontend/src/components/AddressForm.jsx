import { useRef, useState } from "react"
import { Button, Checkbox, FormField, Input, Modal, Select, Textarea, useToast } from "./ui"
import { addressesAPI } from "../lib/api"
import { DISTRICTS } from "../lib/districts"
import { validatePhone } from "../lib/utils"

/**
 * Add / edit a saved address.
 *
 * Changes from the previous version:
 *  - Sits in the shared <Modal>, so it traps focus, closes on Escape and locks
 *    background scroll. The old overlay did none of those, and on a phone the
 *    page behind it scrolled while the form stayed put.
 *  - The phone field is validated rather than merely required. "Phone number
 *    is required" passed on `1`, and the order then failed at delivery time.
 *  - `alert("Failed to save address")` is a toast, and the server's own
 *    message is shown instead of a generic one.
 */

const EMPTY = {
  fullName: "",
  phone: "",
  address: "",
  district: "",
  thana: "",
  country: "Bangladesh",
  isDefault: false,
}

function validate(form) {
  const errors = {}

  if (!form.fullName.trim()) errors.fullName = "Enter the recipient's name"
  else if (form.fullName.trim().length < 2) errors.fullName = "That name looks too short"

  if (!form.phone.trim()) errors.phone = "Enter a phone number"
  else if (!validatePhone(form.phone)) errors.phone = "Enter an 11-digit number starting with 01"

  if (!form.address.trim()) errors.address = "Enter the street address"
  else if (form.address.trim().length < 5) errors.address = "Add a bit more detail — house and road"

  if (!form.district) errors.district = "Choose a district"
  if (!form.thana.trim()) errors.thana = "Enter the thana or upazila"

  return errors
}

const AddressForm = ({ address, onClose, onSave }) => {
  const toast = useToast()
  const isEdit = Boolean(address?._id)

  const [form, setForm] = useState({ ...EMPTY, ...(address || {}) })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const firstRender = useRef(true)

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear the error as soon as the shopper starts fixing it, but never add a
    // new one mid-typing — nagging before they've finished is what made the
    // old checkout form feel hostile.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const setPhone = (value) => setField("phone", value.replace(/\D/g, "").slice(0, 11))

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = validate(form)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      document.getElementById(`address-${Object.keys(found)[0]}`)?.focus()
      return
    }

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      district: form.district,
      thana: form.thana.trim(),
      country: form.country || "Bangladesh",
      isDefault: Boolean(form.isDefault),
    }

    setSaving(true)
    try {
      const response = isEdit
        ? await addressesAPI.update(address._id, payload)
        : await addressesAPI.create(payload)

      onSave?.(response.data?.address)
      toast.success(isEdit ? "Address updated" : "Address saved")
      onClose()
    } catch (error) {
      console.error("Save address error:", error)
      toast.error("Couldn't save the address", {
        description: error.response?.data?.message || "Please check your connection and try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  // Autofocus the first field on open, but only once.
  const focusFirst = (node) => {
    if (node && firstRender.current) {
      firstRender.current = false
      node.focus()
    }
  }

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      closeOnBackdrop={!saving}
      size="lg"
      title={isEdit ? "Edit address" : "Add a new address"}
      description="We deliver anywhere in Bangladesh."
      footer={
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <Button variant="outline" fullWidth disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="address-form" fullWidth loading={saving} loadingText="Saving…">
            {isEdit ? "Save changes" : "Save address"}
          </Button>
        </div>
      }
    >
      <form id="address-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Full name" required error={errors.fullName} htmlFor="address-fullName">
          {(field) => (
            <Input
              {...field}
              ref={focusFirst}
              size="lg"
              name="fullName"
              autoComplete="name"
              placeholder="Who is receiving this?"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
            />
          )}
        </FormField>

        <FormField
          label="Phone number"
          required
          error={errors.phone}
          hint="The courier calls this number before delivery."
          htmlFor="address-phone"
        >
          {(field) => (
            <Input
              {...field}
              size="lg"
              type="tel"
              name="phone"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
        </FormField>

        <FormField label="Street address" required error={errors.address} htmlFor="address-address">
          {(field) => (
            <Textarea
              {...field}
              name="address"
              rows={3}
              autoComplete="street-address"
              placeholder="House / flat, road, area"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          )}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="District" required error={errors.district} htmlFor="address-district">
            {(field) => (
              <Select
                {...field}
                size="lg"
                name="district"
                placeholder="Select district"
                value={form.district}
                onChange={(e) => setField("district", e.target.value)}
              >
                {DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Thana / upazila" required error={errors.thana} htmlFor="address-thana">
            {(field) => (
              <Input
                {...field}
                size="lg"
                name="thana"
                placeholder="e.g. Dhanmondi"
                value={form.thana}
                onChange={(e) => setField("thana", e.target.value)}
              />
            )}
          </FormField>
        </div>

        <div className="rounded-lg bg-gray-50 p-3.5">
          <Checkbox
            id="address-isDefault"
            name="isDefault"
            checked={Boolean(form.isDefault)}
            onChange={(e) => setField("isDefault", e.target.checked)}
            label="Use this as my default address"
            hint="It'll be filled in automatically at checkout."
          />
        </div>
      </form>
    </Modal>
  )
}

export default AddressForm
