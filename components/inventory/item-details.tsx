"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";
import type {
  InventoryItemWithCategorySerialized,
  Issuance,
  ItemStatus,
} from "@/lib/models/types";
import { format } from "date-fns";

const statusVariants: Record<
  ItemStatus,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  in_stock: "success",
  issued: "info",
  under_repair: "warning",
  beyond_repair: "destructive",
  disposed: "secondary",
};

interface ItemDetailsProps {
  item: InventoryItemWithCategorySerialized;
  issuances: Issuance[];
}

export function ItemDetails({ item, issuances }: ItemDetailsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Item Information
              <StatusBadge variant={statusVariants[item.status]}>
                {item.status.replace("_", " ")}
              </StatusBadge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Category</dt>
                <dd className="font-medium">{item.category?.name || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Brand</dt>
                <dd className="font-medium">{item.brand || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Model</dt>
                <dd className="font-medium">{item.model || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Serial Number</dt>
                <dd className="font-medium font-mono">
                  {item.serialNumber || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Location</dt>
                <dd className="font-medium">{item.location || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Purchase Date</dt>
                <dd className="font-medium">
                  {item.purchaseDate
                    ? format(new Date(item.purchaseDate), "MMM d, yyyy")
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Purchase Price
                </dt>
                <dd className="font-medium">
                  {item.purchasePrice
                    ? `$${item.purchasePrice.toFixed(2)}`
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Warranty Expiry
                </dt>
                <dd className="font-medium">
                  {item.warrantyExpiry
                    ? format(new Date(item.warrantyExpiry), "MMM d, yyyy")
                    : "-"}
                </dd>
              </div>
            </dl>
            {item.description && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-1">
                  Description
                </dt>
                <dd>{item.description}</dd>
              </div>
            )}
            {item.notes && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-1">Notes</dt>
                <dd>{item.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Issuance History</CardTitle>
          </CardHeader>
          <CardContent>
            {issuances.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No issuance history
              </p>
            ) : (
              <div className="space-y-4">
                {issuances.map((issuance) => (
                  <div
                    key={issuance._id?.toString()}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">{issuance.issuedTo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Issued:{" "}
                        {format(new Date(issuance.issuedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <StatusBadge
                      variant={
                        issuance.status === "active" ? "info" : "secondary"
                      }
                    >
                      {issuance.status}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <BarcodeDisplay value={item.barcode} type="qr" size={180} />
            <p className="font-mono text-sm">{item.barcode}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(item.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(item.updatedAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
