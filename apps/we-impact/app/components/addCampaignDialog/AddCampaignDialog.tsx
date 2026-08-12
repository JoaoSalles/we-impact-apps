import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CampaignForm } from "../campaignForm/CampaignForm";
import type { CampaignFormValues } from "../campaignForm/schema";
import { useCreateCampaign } from "../campaignForm/useCreateCampaign";

export function AddCampaignDialog({ supporterId }: { supporterId: string }) {
  const [open, setOpen] = useState(false);
  const create = useCreateCampaign(supporterId);

  const handleSubmit = async (values: CampaignFormValues) => {
    try {
      await create.mutateAsync(values);
      toast.success("Campaign created");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign",
      );
      // Re-throw so the form keeps the entered values for correction.
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add campaign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add campaign</DialogTitle>
        </DialogHeader>
        <CampaignForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
