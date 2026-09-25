import { useCallback, useEffect, useRef, useState } from "react"
import { Eye, EyeOff, ImagePlus, Image, Pencil, Plus, Trash2 } from "lucide-react"

import { AdminPageHeader, Panel } from "../../components/admin"
import { Badge, Button, EmptyState, FormField, IconButton, Input, Spinner, useConfirm, useToast } from "../../components/ui"
import { bannersAPI, uploadAPI } from "../../lib/api"

const EMPTY_FORM = { imageUrl: "", publicId: "", buttonLabel: "", buttonUrl: "", sortOrder: "0", isActive: true }
const formFor = (banner) => ({
  imageUrl: banner.imageUrl || "",
  publicId: banner.publicId || "",
  buttonLabel: banner.buttonLabel || "",
  buttonUrl: banner.buttonUrl || "",
  sortOrder: String(banner.sortOrder ?? 0),
  isActive: banner.isActive !== false,
})

const AdminBanners = () => {
  const toast = useToast()
  const confirm = useConfirm()
  const fileInputRef = useRef(null)
  const [banners, setBanners] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await bannersAPI.getAdminList()
      setBanners(data.banners || [])
    } catch (error) {
      toast.error("Could not load banners", { description: error.response?.data?.message || "Please try again." })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const resetForm = () => { setEditingId(null); setForm(EMPTY_FORM) }

  const uploadImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadAPI.single(file)
      setForm((current) => ({ ...current, imageUrl: data.imageUrl || data.url, publicId: data.publicId || "" }))
      toast.success("Banner image uploaded")
    } catch (error) {
      toast.error("Image upload failed", { description: error.response?.data?.message || "Please try again." })
    } finally {
      setUploading(false)
    }
  }

  const save = async (event) => {
    event.preventDefault()
    if (!form.imageUrl) return toast.error("Add a banner image first")
    setSaving(true)
    const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 }
    try {
      const { data } = editingId ? await bannersAPI.update(editingId, payload) : await bannersAPI.create(payload)
      setBanners((current) => {
        const next = editingId ? current.map((banner) => (banner._id === editingId ? data.banner : banner)) : [...current, data.banner]
        return next.sort((a, b) => a.sortOrder - b.sortOrder)
      })
      toast.success(editingId ? "Banner updated" : "Banner created")
      resetForm()
    } catch (error) {
      toast.error("Could not save banner", { description: error.response?.data?.message || "Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const editBanner = (banner) => {
    setEditingId(banner._id)
    setForm(formFor(banner))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleVisibility = async (banner) => {
    try {
      const { data } = await bannersAPI.update(banner._id, { ...formFor(banner), isActive: banner.isActive === false })
      setBanners((current) => current.map((item) => (item._id === banner._id ? data.banner : item)))
      toast.success(data.banner.isActive ? "Banner is live" : "Banner hidden")
    } catch (error) {
      toast.error("Could not change visibility", { description: error.response?.data?.message || "Please try again." })
    }
  }

  const deleteBanner = async (banner) => {
    const ok = await confirm({ title: "Delete banner?", message: "This removes the slide from the homepage.", confirmLabel: "Delete banner", tone: "danger" })
    if (!ok) return
    try {
      await bannersAPI.delete(banner._id)
      setBanners((current) => current.filter((item) => item._id !== banner._id))
      if (editingId === banner._id) resetForm()
      toast.success("Banner deleted")
    } catch (error) {
      toast.error("Could not delete banner", { description: error.response?.data?.message || "Please try again." })
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Hero banners"
        description="Control every image and optional button on the homepage hero."
        actions={editingId ? <Button variant="outline" onClick={resetForm}>Cancel edit</Button> : <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>Add banner</Button>}
      />

      <Panel title={editingId ? "Edit banner" : "New banner"} description="Image is required. The button fields are optional.">
        <form onSubmit={save} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <FormField label="Banner image" required>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" loading={uploading} onClick={() => fileInputRef.current?.click()} leftIcon={<ImagePlus className="h-4 w-4" />}>Upload image</Button>
                {form.imageUrl && <span className="text-sm text-green-700">Image ready</span>}
              </div>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Button label" htmlFor="banner-button-label" hint="Optional">
                {(field) => <Input {...field} value={form.buttonLabel} onChange={(event) => setField("buttonLabel", event.target.value)} placeholder="Shop now" />}
              </FormField>
              <FormField label="Button link" htmlFor="banner-button-url" hint="Optional">
                {(field) => <Input {...field} value={form.buttonUrl} onChange={(event) => setField("buttonUrl", event.target.value)} placeholder="/products" />}
              </FormField>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <FormField label="Display order" htmlFor="banner-sort" className="w-40">
                {(field) => <Input {...field} type="number" min="0" value={form.sortOrder} onChange={(event) => setField("sortOrder", event.target.value)} />}
              </FormField>
              <label className="flex h-11 items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                Show on homepage
              </label>
              <Button type="submit" loading={saving}>{editingId ? "Save changes" : "Create banner"}</Button>
            </div>
          </div>
          <div className="aspect-[16/9] overflow-hidden rounded-card border border-dashed border-gray-300 bg-gray-50">
            {form.imageUrl ? <img src={form.imageUrl} alt="Banner preview" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-gray-500"><Image className="h-7 w-7 text-gray-400" />Upload an image to preview it here.</div>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadImage} className="sr-only" />
        </form>
      </Panel>

      {loading ? (
        <div className="flex min-h-[14rem] items-center justify-center"><Spinner label="Loading banners" /></div>
      ) : banners.length === 0 ? (
        <Panel><EmptyState icon={<Image />} title="No hero banners yet" description="Upload your first banner to show it on the homepage." action={<Button onClick={() => fileInputRef.current?.click()} leftIcon={<Plus className="h-4 w-4" />}>Add banner</Button>} /></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <article key={banner._id} className="overflow-hidden rounded-card border border-gray-200 bg-white">
              <img src={banner.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={banner.isActive === false ? "neutral" : "brand-solid"} size="xs">{banner.isActive === false ? "Hidden" : "Live"}</Badge>
                  <span className="text-xs font-medium text-gray-500">Order {banner.sortOrder}</span>
                </div>
                <p className="truncate text-sm font-medium text-gray-800">{banner.buttonLabel || "No button"}</p>
                <div className="flex items-center justify-end gap-1">
                  <IconButton label={banner.isActive === false ? "Show banner" : "Hide banner"} size="sm" variant="ghost" onClick={() => toggleVisibility(banner)}>{banner.isActive === false ? <Eye /> : <EyeOff />}</IconButton>
                  <IconButton label="Edit banner" size="sm" variant="ghost" onClick={() => editBanner(banner)}><Pencil /></IconButton>
                  <IconButton label="Delete banner" size="sm" variant="danger" onClick={() => deleteBanner(banner)}><Trash2 /></IconButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminBanners
