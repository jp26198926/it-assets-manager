"use client";

import type { Issuance } from "@/lib/models/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

interface IssuanceDetailsDialogProps {
  issuance: Issuance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssuanceDetailsDialog({
  issuance,
  open,
  onOpenChange,
}: IssuanceDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Issuance Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Item Information</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Item Name</dt>
                <dd className="font-medium">{issuance.itemName}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Barcode</dt>
                <dd className="font-mono text-sm">{issuance.itemBarcode}</dd>
              </div>
            </dl>
          </div>

          {/* Issuance Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Issuance Information</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Issued To</dt>
                <dd className="font-medium">{issuance.issuedTo.name}</dd>
                <dd className="text-xs text-muted-foreground capitalize">
                  {issuance.issuedTo.type}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Issued By</dt>
                <dd className="font-medium">{issuance.issuedBy}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Issued Date</dt>
                <dd className="font-medium">
                  {format(
                    new Date(issuance.issuedAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Expected Return
                </dt>
                <dd className="font-medium">
                  {issuance.expectedReturn
                    ? format(new Date(issuance.expectedReturn), "MMM d, yyyy")
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge
                    variant={
                      issuance.status === "active" ? "info" : "secondary"
                    }
                  >
                    {issuance.status}
                  </StatusBadge>
                </dd>
              </div>
            </dl>
            {issuance.notes && (
              <div className="mt-3">
                <dt className="text-sm text-muted-foreground mb-1">Notes</dt>
                <dd className="text-sm">{issuance.notes}</dd>
              </div>
            )}
          </div>

          {/* Return Information */}
          {issuance.status === "returned" && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Return Information</h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Returned Date
                  </dt>
                  <dd className="font-medium">
                    {issuance.returnedAt
                      ? format(
                          new Date(issuance.returnedAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Return Status
                  </dt>
                  <dd>
                    {issuance.returnStatus && (
                      <StatusBadge
                        variant={
                          issuance.returnStatus === "good"
                            ? "success"
                            : issuance.returnStatus === "damaged" ||
                                issuance.returnStatus === "needs_repair"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {issuance.returnStatus.replace("_", " ")}
                      </StatusBadge>
                    )}
                  </dd>
                </div>
              </dl>
              {issuance.returnRemarks && (
                <div className="mt-3">
                  <dt className="text-sm text-muted-foreground mb-1">
                    Return Remarks
                  </dt>
                  <dd className="text-sm">{issuance.returnRemarks}</dd>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
