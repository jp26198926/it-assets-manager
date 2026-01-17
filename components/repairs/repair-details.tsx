"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  RepairRecord,
  Ticket,
  InventoryItem,
  RepairOutcome,
} from "@/lib/models/types";
import { format } from "date-fns";
import {
  completeRepair,
  markReturnedToUser,
  updateRepairRecord,
} from "@/lib/actions/repairs";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  TicketIcon,
  Wrench,
} from "lucide-react";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";
import Link from "next/link";

const outcomeVariants: Record<
  RepairOutcome,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  pending: "warning",
  fixed: "success",
  beyond_repair: "destructive",
};

interface RepairDetailsProps {
  repair: RepairRecord;
  ticket: Ticket | null;
  item: InventoryItem | null;
}

export function RepairDetails({ repair, ticket, item }: RepairDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<"fixed" | "beyond_repair">("fixed");
  const [actionsTaken, setActionsTaken] = useState(repair.actionsTaken || "");
  const [partsUsed, setPartsUsed] = useState(
    repair.partsUsed?.join(", ") || "",
  );
  const [diagnosis, setDiagnosis] = useState(repair.diagnosis || "");

  const handleSaveDiagnosis = () => {
    startTransition(async () => {
      await updateRepairRecord(repair._id!.toString(), { diagnosis });
      router.refresh();
    });
  };

  const handleCompleteRepair = () => {
    startTransition(async () => {
      const parts = partsUsed
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const result = await completeRepair(
        repair._id!.toString(),
        outcome,
        actionsTaken,
        parts.length > 0 ? parts : undefined,
      );
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleReturnToUser = () => {
    startTransition(async () => {
      const result = await markReturnedToUser(repair._id!.toString());
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Repair Information
              <StatusBadge variant={outcomeVariants[repair.outcome]}>
                {repair.outcome.replace("_", " ")}
              </StatusBadge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Ticket Number</dt>
                <dd className="font-medium font-mono">{repair.ticketNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Technician</dt>
                <dd className="font-medium">
                  {(repair as any).technician?.name || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Received</dt>
                <dd className="font-medium">
                  {format(
                    new Date(repair.receivedAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </dd>
              </div>
              {repair.completedAt && (
                <div>
                  <dt className="text-sm text-muted-foreground">Completed</dt>
                  <dd className="font-medium">
                    {format(
                      new Date(repair.completedAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </dd>
                </div>
              )}
              {repair.returnedToUser && repair.returnedAt && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Returned to User
                  </dt>
                  <dd className="font-medium">
                    {format(
                      new Date(repair.returnedAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {repair.diagnosis && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-1">
                  Diagnosis
                </dt>
                <dd>{repair.diagnosis}</dd>
              </div>
            )}

            {repair.actionsTaken && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-1">
                  Actions Taken
                </dt>
                <dd>{repair.actionsTaken}</dd>
              </div>
            )}

            {repair.partsUsed && repair.partsUsed.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-1">
                  Parts Used
                </dt>
                <dd>{repair.partsUsed.join(", ")}</dd>
              </div>
            )}

            {repair.notes && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-1">Notes</dt>
                <dd>{repair.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Details */}
        {item && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <BarcodeDisplay value={item.barcode} type="qr" size={100} />
                <div className="flex-1">
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Name</dt>
                      <dd className="font-medium">{item.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Barcode</dt>
                      <dd className="font-medium font-mono">{item.barcode}</dd>
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
                      <dt className="text-sm text-muted-foreground">
                        Serial Number
                      </dt>
                      <dd className="font-medium font-mono">
                        {item.serialNumber || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Current Status
                      </dt>
                      <dd>
                        <StatusBadge
                          variant={
                            item.status === "in_stock"
                              ? "success"
                              : item.status === "under_repair"
                                ? "warning"
                                : item.status === "beyond_repair"
                                  ? "destructive"
                                  : "secondary"
                          }
                        >
                          {item.status.replace("_", " ")}
                        </StatusBadge>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ticket Details */}
        {ticket && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TicketIcon className="h-5 w-5" />
                Related Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Ticket Number
                  </dt>
                  <dd className="font-medium font-mono">
                    {ticket.ticketNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Title</dt>
                  <dd className="font-medium">{ticket.title}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Reporter</dt>
                  <dd className="font-medium">
                    {ticket.reportedBy.name} ({ticket.reportedBy.email})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge
                      variant={
                        ticket.status === "open"
                          ? "destructive"
                          : ticket.status === "in_progress"
                            ? "warning"
                            : ticket.status === "resolved"
                              ? "success"
                              : "secondary"
                      }
                    >
                      {ticket.status.replace("_", " ")}
                    </StatusBadge>
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <Link href={`/tickets/${ticket._id}`}>
                  <Button variant="outline" size="sm">
                    View Full Ticket
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {/* Update Diagnosis */}
        {repair.outcome === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Update Diagnosis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Describe the issue found"
                  className="bg-secondary"
                />
              </div>
              <Button
                onClick={handleSaveDiagnosis}
                disabled={isPending}
                className="w-full"
                variant="secondary"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Diagnosis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Complete Repair */}
        {repair.outcome === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complete Repair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Outcome</Label>
                <RadioGroup
                  value={outcome}
                  onValueChange={(value) =>
                    setOutcome(value as "fixed" | "beyond_repair")
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label
                      htmlFor="fixed"
                      className="font-normal flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Fixed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beyond_repair" id="beyond_repair" />
                    <Label
                      htmlFor="beyond_repair"
                      className="font-normal flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                      Beyond Repair (For Replacement)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Actions Taken *</Label>
                <Textarea
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  placeholder="Describe what was done"
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label>Parts Used</Label>
                <Input
                  value={partsUsed}
                  onChange={(e) => setPartsUsed(e.target.value)}
                  placeholder="Comma-separated list of parts"
                  className="bg-secondary"
                />
              </div>

              <Button
                onClick={handleCompleteRepair}
                disabled={isPending || !actionsTaken}
                className="w-full"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Complete Repair
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Return to User */}
        {repair.outcome === "fixed" && !repair.returnedToUser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Return to User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The item has been fixed. Mark it as returned to the user to
                close the repair.
              </p>
              <Button
                onClick={handleReturnToUser}
                disabled={isPending}
                className="w-full"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mark as Returned to User
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">Received</p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(repair.receivedAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>
              {repair.completedAt && (
                <div className="flex gap-3">
                  <div
                    className={`w-2 h-2 mt-2 rounded-full ${repair.outcome === "fixed" ? "bg-success" : "bg-destructive"}`}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {repair.outcome === "fixed"
                        ? "Fixed"
                        : "Marked Beyond Repair"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(repair.completedAt),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>
              )}
              {repair.returnedToUser && repair.returnedAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-success" />
                  <div>
                    <p className="text-sm font-medium">Returned to User</p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(repair.returnedAt),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
