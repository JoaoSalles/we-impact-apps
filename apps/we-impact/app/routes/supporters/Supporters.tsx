import { useCallback } from "react";
import { useSearchParams } from "react-router";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { SupporterForm } from "@/components/supporterForm/SupporterForm";
import { SupporterList } from "@/components/supporterList/SupporterList";
import { useSupporters } from "./useSupporters";

const TABS = ["create", "list"] as const;
type SupportersTab = (typeof TABS)[number];

const DEFAULT_TAB: SupportersTab = "list";

function isSupportersTab(value: string | null): value is SupportersTab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

export default function SupportersComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("tab");
  const activeTab: SupportersTab = isSupportersTab(param) ? param : DEFAULT_TAB;

  const { handleCreateSupporter } = useSupporters();

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
      <h1 className="text-xl font-semibold">Supporters</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="create">Creation</TabsTrigger>
        </TabsList>

        <TabsContent value="list" forceMount>
          <h2 className="mb-4 text-lg font-medium">Supporters</h2>
          <SupporterList />
        </TabsContent>

        <TabsContent value="create" forceMount>
          <h2 className="text-lg font-medium">Create supporter</h2>
          <SupporterForm onSubmit={handleCreateSupporter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
