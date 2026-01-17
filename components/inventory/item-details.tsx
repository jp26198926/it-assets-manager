"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";
import { Button } from "@/components/ui/button";
import type {
  InventoryItemWithCategorySerialized,
  Issuance,
  ItemStatus,
  TicketWithDepartmentSerialized,
  TicketStatus,
} from "@/lib/models/types";
import { format } from "date-fns";
import Link from "next/link";
import { Package } from "lucide-react";

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

const ticketStatusVariants: Record<
  TicketStatus,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  open: "secondary",
  in_progress: "info",
  waiting_parts: "warning",
  resolved: "success",
  closed: "secondary",
  defective_closed: "destructive",
};

interface ItemDetailsProps {
  item: InventoryItemWithCategorySerialized;
  issuances: Issuance[];
  tickets: TicketWithDepartmentSerialized[];
}

export function ItemDetails({ item, issuances, tickets }: ItemDetailsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Item Information</CardTitle>
                <StatusBadge variant={statusVariants[item.status]}>
                  {item.status.replace("_", " ")}
                </StatusBadge>
              </div>
              {item.status === "in_stock" && (
                <Link href={`/issuance/new?itemId=${item._id}`}>
                  <Button size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Issue Item
                  </Button>
                </Link>
              )}
            </div>
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
            <CardTitle className="text-lg">Repair History</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No repair history</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    href={`/tickets/${ticket._id}`}
                    className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">#{ticket.ticketNumber}</p>
                          <StatusBadge
                            variant={ticketStatusVariants[ticket.status]}
                          >
                            {ticket.status.replace("_", " ")}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ticket.title}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>
                            Reported:{" "}
                            {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                          </span>
                          {ticket.assignedUser && (
                            <span>Assigned to: {ticket.assignedUser.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
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
                      "MMM d, yyyy 'at' h:mm a",
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
                      "MMM d, yyyy 'at' h:mm a",
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
