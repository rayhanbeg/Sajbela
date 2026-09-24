import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { cn } from "../../lib/cn"
import { Skeleton } from "../ui"

/**
 * Responsive admin table.
 *
 * From `lg` up it renders a real `<table>`. Below that, each row becomes a
 * card. It is deliberately *not* an `overflow-x-auto` wrapper: the three admin
 * tables each had seven or eight columns inside one, so on a phone every
 * screen was a horizontal scroll with the actions column — the only thing an
 * admin comes to a row to use — parked off the right edge.
 *
 * One column set describes both layouts, so the two can't drift.
 *
 * Column:
 *   key        unique, also used as the React key
 *   header     column heading; doubles as the card row's label
 *   cell       (row) => node
 *   sortKey    present ⇒ the header is a sort button
 *   align      "left" (default) | "center" | "right"
 *   card       where the cell goes in the card layout:
 *              "title"   full-width at the top
 *              "meta"    top-right, next to the title
 *              "row"     a label/value line (default)
 *              "actions" footer strip
 *              "hidden"  desktop only
 *   cardLabel  overrides `header` as the card row's label
 */

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

const SORT_ICONS = { asc: ArrowUp, desc: ArrowDown }

const SortButton = ({ column, sort, onSortChange }) => {
  const active = sort?.key === column.sortKey
  const Icon = active ? SORT_ICONS[sort.direction] || ChevronsUpDown : ChevronsUpDown

  return (
    <button
      type="button"
      onClick={() => onSortChange?.(column.sortKey)}
      className={cn(
        "group inline-flex items-center gap-1 rounded transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
        active ? "text-gray-900" : "hover:text-gray-700",
      )}
    >
      {column.header}
      <Icon
        aria-hidden="true"
        className={cn("h-3.5 w-3.5 shrink-0", active ? "text-pink-600" : "text-gray-300 group-hover:text-gray-400")}
      />
    </button>
  )
}

const DataTable = ({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 5,
  empty = null,
  sort,
  onSortChange,
  caption,
  className,
  onRowClick,
}) => {
  const placement = (column, index) => column.card || (index === 0 ? "title" : "row")

  const titleColumns = columns.filter((column, index) => placement(column, index) === "title")
  const metaColumns = columns.filter((column, index) => placement(column, index) === "meta")
  const rowColumns = columns.filter((column, index) => placement(column, index) === "row")
  const actionColumns = columns.filter((column, index) => placement(column, index) === "actions")

  if (loading) {
    return (
      <div className={cn("overflow-hidden rounded-card border border-gray-200 bg-white", className)}>
        {/* Desktop skeleton keeps the header so the column widths don't jump
            when the data lands. */}
        <table className="hidden w-full lg:table">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500",
                    ALIGN[column.align] || ALIGN.left,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4">
                    <Skeleton className="h-4 w-full max-w-[10rem]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-gray-100 lg:hidden">
          {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
            <li key={rowIndex} className="space-y-2.5 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return <div className={cn("rounded-card border border-gray-200 bg-white", className)}>{empty}</div>
  }

  return (
    <div className={cn("overflow-hidden rounded-card border border-gray-200 bg-white", className)}>
      {/* lg+ : table */}
      <table className="hidden w-full lg:table">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => {
              const sorted = column.sortKey && sort?.key === column.sortKey
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500",
                    ALIGN[column.align] || ALIGN.left,
                    column.headerClass,
                  )}
                >
                  {column.sortKey ? (
                    <SortButton column={column} sort={sort} onSortChange={onSortChange} />
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("transition-colors duration-150", onRowClick ? "cursor-pointer hover:bg-gray-50" : "hover:bg-gray-50/60")}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-3.5 align-middle text-sm", ALIGN[column.align] || ALIGN.left, column.cellClass)}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* < lg : stacked cards */}
      <ul className="divide-y divide-gray-100 lg:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="p-4">
            {(titleColumns.length > 0 || metaColumns.length > 0) && (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {titleColumns.map((column) => (
                    <div key={column.key}>{column.cell(row)}</div>
                  ))}
                </div>
                {metaColumns.length > 0 && (
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {metaColumns.map((column) => (
                      <div key={column.key}>{column.cell(row)}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {rowColumns.length > 0 && (
              <dl className="mt-3 space-y-1.5 text-sm">
                {rowColumns.map((column) => (
                  <div key={column.key} className="flex items-baseline justify-between gap-4">
                    <dt className="shrink-0 text-gray-500">{column.cardLabel || column.header}</dt>
                    <dd className="min-w-0 text-right font-medium text-gray-900">{column.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}

            {actionColumns.length > 0 && (
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3.5">
                {actionColumns.map((column) => (
                  <div key={column.key} className="flex flex-wrap items-center gap-2">
                    {column.cell(row)}
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DataTable
