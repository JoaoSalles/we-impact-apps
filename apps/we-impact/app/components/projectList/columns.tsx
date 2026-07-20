import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router";
import { Eye } from "lucide-react";

import type { Project } from "@/api/institution-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const projectColumns: ColumnDef<Project>[] = [
  { accessorKey: "title", header: "Title" },
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
    id: "goal",
    header: "Goal",
    cell: ({ row }) => {
      const { currentGoal, goal } = row.original;
      const target = goal === null ? "—" : goal.toLocaleString();
      return `${currentGoal.toLocaleString()} / ${target}`;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" aria-label="View project">
                  <Link to={`projects/${row.original.id}`}>
                    <Eye />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
    ),
  },
];
