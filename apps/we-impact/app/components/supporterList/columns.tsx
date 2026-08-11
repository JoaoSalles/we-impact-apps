import type { ColumnDef } from "@tanstack/react-table";

import type { Supporter } from "@/api/supporter-api";

export const supporterColumns: ColumnDef<Supporter>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "document", header: "Document" },
  { accessorKey: "website", header: "Website" },
  {
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ getValue }) =>
      new Date(getValue<string>()).toLocaleDateString(),
  },
];
