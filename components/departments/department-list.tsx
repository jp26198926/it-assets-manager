"use client"

import type { Department } from "@/lib/models/types"
import { DataTable } from "@/components/ui/data-table"
import { format } from "date-fns"

export function DepartmentList({ departments }: { departments: Department[] }) {
  const columns = [
    {
      key: "code",
      header: "Code",
      cell: (dept: Department) => <span className="font-mono text-sm">{dept.code}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (dept: Department) => <span className="font-medium">{dept.name}</span>,
    },
    {
      key: "description",
      header: "Description",
      cell: (dept: Department) => <span className="text-muted-foreground">{dept.description || "-"}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (dept: Department) => (
        <span className="text-sm text-muted-foreground">{format(new Date(dept.createdAt), "MMM d, yyyy")}</span>
      ),
      className: "hidden lg:table-cell",
    },
  ]

  return <DataTable data={departments} columns={columns} emptyMessage="No departments found" />
}
