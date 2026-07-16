import { useCallback } from "react";
import { useSearchParams } from "react-router";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { InstitutionForm } from "@/components/institutionForm/InstitutionForm";
import { InstitutionsList } from "./InstitutionsList";
import { useInstitutions } from "./useInstitutions";

const TABS = ["create", "list"] as const;
type InstitutionsTab = (typeof TABS)[number];

const DEFAULT_TAB: InstitutionsTab = "list";

function isInstitutionsTab(value: string | null): value is InstitutionsTab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

export default function InstitutionsComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("tab");
  const activeTab: InstitutionsTab = isInstitutionsTab(param)
    ? param
    : DEFAULT_TAB;

  const { handleCreateInstitution } = useInstitutions();

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
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="create">Creation</TabsTrigger>
        </TabsList>

        <TabsContent value="create" forceMount>
          <h2 className="text-lg font-medium">Create institution</h2>
          <InstitutionForm onSubmit={handleCreateInstitution} />
        </TabsContent>

        <TabsContent value="list" forceMount>
          <h2 className="mb-4 text-lg font-medium">Institutions</h2>
          <InstitutionsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
