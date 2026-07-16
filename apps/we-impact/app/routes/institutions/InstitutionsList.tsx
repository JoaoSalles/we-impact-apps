import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/dataTable/DataTable";

import { institutionColumns } from "./columns";
import { useInstitutionList } from "./useInstitutionList";

export function InstitutionsList() {
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
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Name"
          placeholder="Name"
          value={filters.name}
          onChange={(event) => setName(event.target.value)}
          className="max-w-xs"
        />
        <Input
          aria-label="City"
          placeholder="City"
          value={filters.city}
          onChange={(event) => setCity(event.target.value)}
          className="max-w-xs"
        />
        <Input
          aria-label="State"
          placeholder="State"
          value={filters.state}
          onChange={(event) => setState(event.target.value)}
          className="max-w-xs"
        />
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
