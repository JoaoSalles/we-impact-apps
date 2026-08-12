import { useParams } from "react-router";
import { toast } from "sonner";

import { AddCampaignDialog } from "@/components/addCampaignDialog/AddCampaignDialog";
import { SupporterForm } from "@/components/supporterForm/SupporterForm";
import type { SupporterFormValues } from "@/components/supporterForm/schema";
import { CampaignList } from "@/components/campaignList/CampaignList";
import { useEditSupporter, useUpdateSupporter } from "./useEditSupporter";

export default function ViewSupporter() {
  const { id } = useParams();
  const { data, isPending, error } = useEditSupporter(id ?? "");
  const update = useUpdateSupporter(id ?? "");

  const handleSubmit = async (values: SupporterFormValues) => {
    try {
      await update.mutateAsync(values);
      toast.success("Supporter updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update supporter",
      );
      throw error;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Supporter Overview</h1>

      {isPending && (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load supporter"}
        </p>
      )}

      {data && (
        <div className="mt-4">
          <SupporterForm
            defaultValues={data}
            onSubmit={handleSubmit}
            clearOnSubmit={false}
            editToggle
          />
        </div>
      )}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Campaigns:</h1>
          <AddCampaignDialog supporterId={id ?? ""} />
        </div>
        <div className="mt-4">
          <CampaignList supporterId={id ?? ""} />
        </div>
      </div>
    </div>
  );
}
