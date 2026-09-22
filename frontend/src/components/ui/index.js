/**
 * Shared UI layer for the Sajbela storefront + admin.
 *
 * Import from here rather than deep paths:
 *   import { Button, Card, useToast } from "../components/ui"
 *
 * Everything in this folder is palette-locked to the brand pink scale defined
 * in tailwind.config.js. Add variants there, not ad-hoc colours in pages.
 */

export { default as Button } from "./Button"
export { default as IconButton } from "./IconButton"
export { default as Spinner } from "./Spinner"

export { default as FormField } from "./FormField"
export { default as Input } from "./Input"
export { default as Textarea } from "./Textarea"
export { default as Select } from "./Select"
export { default as Checkbox } from "./Checkbox"
export { default as Radio, RadioCard } from "./Radio"

export { default as Badge, CountBadge } from "./Badge"
export { default as Card, CardHeader, CardBody, CardFooter } from "./Card"
export { default as Image } from "./Image"
export { default as Price, getDiscount } from "./Price"
export { default as Rating, RatingInput } from "./Rating"
export { default as QuantityStepper } from "./QuantityStepper"

export { default as Skeleton, SkeletonText, SkeletonProductCard, SkeletonProductGrid } from "./Skeleton"
export { default as EmptyState } from "./EmptyState"
export { default as ErrorState } from "./ErrorState"

export { default as Modal } from "./Modal"
export { default as Drawer } from "./Drawer"
export { default as ToastProvider, useToast } from "./Toast"
export { default as ConfirmProvider, useConfirm } from "./ConfirmDialog"

export { default as Tabs } from "./Tabs"
export { default as Accordion, AccordionItem } from "./Accordion"
export { default as Breadcrumbs } from "./Breadcrumbs"
export { default as Pagination } from "./Pagination"
export { default as SectionHeader } from "./SectionHeader"
