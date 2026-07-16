import { render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

import { DataTable } from "./DataTable";

interface Row {
  name: string;
  city: string;
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City" },
];

describe("DataTable", () => {
  it("renders headers and a row per data item", () => {
    render(
      <DataTable columns={columns} data={[{ name: "Acme", city: "Rio" }]} />,
    );

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Acme")).toBeTruthy();
    expect(screen.getByText("Rio")).toBeTruthy();
  });

  it("renders the empty message when there are no rows", () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="Nothing here" />,
    );

    expect(screen.getByText("Nothing here")).toBeTruthy();
  });
});
