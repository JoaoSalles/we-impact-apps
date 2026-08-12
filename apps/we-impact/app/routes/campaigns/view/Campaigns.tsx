import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { AddProjectTargetDialog } from "@/components/addProjectTargetDialog/AddProjectTargetDialog";
import { CampaignForm } from "@/components/campaignForm/CampaignForm";
import {
  extraContentToRows,
  type CampaignFormValues,
} from "@/components/campaignForm/schema";
import { CampaignTargetList } from "@/components/campaignTargetList/CampaignTargetList";
import { Button } from "@/components/ui/button";
import { useCampaign, useUpdateCampaign } from "./useEditCampaign";

export default function CampaignView() {
  const { supporterID, campaignID } = useParams();
  const { data, isPending, error } = useCampaign(
    supporterID ?? "",
    campaignID ?? "",
  );
  const update = useUpdateCampaign(supporterID ?? "", campaignID ?? "");

  const handleSubmit = async (values: CampaignFormValues) => {
    try {
      await update.mutateAsync(values);
      toast.success("Campaign updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update campaign",
      );
      throw error;
    }
  };

  return (
    <div className="p-4">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to={`/supporters/${supporterID}`}>
          <ArrowLeft />
          Back to supporter
        </Link>
      </Button>

      <h1 className="text-xl font-semibold">Campaign Overview</h1>

      {isPending && (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load campaign"}
        </p>
      )}

      {data && (
        <div className="mt-4">
          <CampaignForm
            defaultValues={{
              name: data.name,
              description: data.description ?? "",
              status: data.status,
              extraContent: extraContentToRows(data.extraContent),
            }}
            onSubmit={handleSubmit}
            clearOnSubmit={false}
            editToggle
            showStatus
            showExtraContent
          />
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects:</h1>
          <AddProjectTargetDialog campaignId={campaignID ?? ""} />
        </div>
        <div className="mt-4">
          <CampaignTargetList campaignId={campaignID ?? ""} />
        </div>
      </div>
    </div>
  );
}
