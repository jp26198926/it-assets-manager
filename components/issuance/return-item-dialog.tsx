"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { returnItem } from "@/lib/actions/issuance";
import type { IssuanceSerialized } from "@/lib/models/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReturnItemDialogProps {
  issuance: IssuanceSerialized;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReturnItemDialog({
  issuance,
  open,
  onOpenChange,
  onSuccess,
}: ReturnItemDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [returnStatus, setReturnStatus] = useState<
    "good" | "damaged" | "needs_repair" | "beyond_repair"
  >("good");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await returnItem(issuance._id!.toString(), {
        returnRemarks: formData.get("returnRemarks") as string,
        returnStatus,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Item returned successfully",
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to return item",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Return Item</DialogTitle>
          <DialogDescription>
            Please provide details about the returned item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 p-3 bg-muted rounded-md">
            <p className="font-semibold">{issuance.itemName}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {issuance.itemBarcode}
            </p>
            <p className="text-sm">
              Issued to:{" "}
              <span className="font-medium">{issuance.issuedTo.name}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnStatus">Return Status *</Label>
            <Select
              name="returnStatus"
              required
              value={returnStatus}
              onValueChange={(value: any) => setReturnStatus(value)}
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Select return status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good Condition</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="needs_repair">Needs Repair</SelectItem>
                <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {returnStatus === "good" &&
                "Item will be marked as available (In Stock)"}
              {(returnStatus === "damaged" ||
                returnStatus === "needs_repair") &&
                "Item will be marked as Under Repair"}
              {returnStatus === "beyond_repair" &&
                "Item will be marked as Beyond Repair"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnRemarks">Remarks</Label>
            <Textarea
              id="returnRemarks"
              name="returnRemarks"
              className="bg-secondary"
              placeholder="Any notes about the condition of the returned item..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Return
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
