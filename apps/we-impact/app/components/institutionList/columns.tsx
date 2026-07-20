import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router";
import { Eye } from "lucide-react";

import type { Institution } from "@/api/institution-api";
import { Button } from "@/components/ui/button";

export const institutionColumns: ColumnDef<Institution>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
  { accessorKey: "state", header: "State" },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
        <Button asChild variant="ghost" size="icon" aria-label="View institution">
          <Link to={`/institutions/${row.original.id}/edit`}>
            <Eye />
          </Link>
        </Button>
      </div>
    ),
  },
];
