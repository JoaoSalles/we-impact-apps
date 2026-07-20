import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router";
import { Eye } from "lucide-react";

import type { Institution } from "@/api/institution-api";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const institutionColumns: ColumnDef<Institution>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
  { accessorKey: "state", header: "State" },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" aria-label="Manage institution">
                <Link to={`/institutions/${row.original.id}`}>
                  <Eye />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage institution</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  },
];
