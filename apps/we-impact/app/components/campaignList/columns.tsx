import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router";
import { Eye } from "lucide-react";

import type { Campaign } from "@/api/supporter-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const campaignColumns: ColumnDef<Campaign>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status ? (
        <Badge>Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" aria-label="View campaign">
                <Link
                  to={`/supporters/${row.original.supporterId}/campaigns/${row.original.id}`}
                >
                  <Eye />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Campaign</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  },
];
