import type { ColumnDef } from "@tanstack/react-table";

import type { Institution } from "@/api/institution-api";

export const institutionColumns: ColumnDef<Institution>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
  { accessorKey: "state", header: "State" },
];
