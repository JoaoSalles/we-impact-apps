import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/dataTable/DataTable";

import { institutionColumns } from "./columns";
import { useInstitutionList } from "./useInstitutionList";

export function InstitutionList() {
  const {
    items,
    hasNext,
    pageNumber,
    loading,
    error,
    filters,
    setName,
    setCity,
    setState,
    goToPage,
  } = useInstitutionList();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-name">Name:</Label>
          <Input
            id="filter-name"
            placeholder="Name"
            value={filters.name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-city">City:</Label>
          <Input
            id="filter-city"
            placeholder="City"
            value={filters.city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-state">State:</Label>
          <Input
            id="filter-state"
            placeholder="State"
            value={filters.state}
            onChange={(event) => setState(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <DataTable
          columns={institutionColumns}
          data={items}
          emptyMessage="No institutions found"
        />
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Page {pageNumber + 1}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber === 0}
            onClick={() => goToPage(pageNumber - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => goToPage(pageNumber + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
