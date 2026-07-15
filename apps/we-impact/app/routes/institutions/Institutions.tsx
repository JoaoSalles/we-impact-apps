import { useCallback } from "react";
import { useSearchParams } from "react-router";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

const TABS = ["create", "list"] as const;
type InstitutionsTab = (typeof TABS)[number];

const DEFAULT_TAB: InstitutionsTab = "create";

function isInstitutionsTab(value: string | null): value is InstitutionsTab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

export default function InstitutionsComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("tab");
  const activeTab: InstitutionsTab = isInstitutionsTab(param)
    ? param
    : DEFAULT_TAB;

  const handleTabChange = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          prev.set("tab", value);
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Institutions</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
        <TabsList>
          <TabsTrigger value="create">Creation</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="create" forceMount>
          <h2 className="text-lg font-medium">Create institution</h2>
          <p className="text-muted-foreground">Creation form coming soon.</p>
        </TabsContent>

        <TabsContent value="list" forceMount>
          <h2 className="text-lg font-medium">Institutions list</h2>
          <p className="text-muted-foreground">Institutions list coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
