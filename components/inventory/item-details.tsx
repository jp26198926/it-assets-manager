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
import { Package, Download, Printer } from "lucide-react";
import { useState, useRef } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);
  const printCanvasRef = useRef<HTMLCanvasElement>(null);

  const colorOptions = [
    { value: "#000000", label: "Black" },
    { value: "#ffffff", label: "White" },
    { value: "#ef4444", label: "Red" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#22c55e", label: "Green" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#8b5cf6", label: "Purple" },
  ];

  const generateQRCode = async (
    canvas: HTMLCanvasElement | null,
    color: string,
  ) => {
    if (!canvas) return;

    await QRCode.toCanvas(canvas, item.barcode, {
      width: 400,
      margin: 2,
      color: {
        dark: color,
        light: "#00000000",
      },
    });
  };

  const handleDownload = async () => {
    if (!downloadCanvasRef.current) return;

    await generateQRCode(downloadCanvasRef.current, selectedColor);

    const link = document.createElement("a");
    link.download = `${item.barcode}-QR.png`;
    link.href = downloadCanvasRef.current.toDataURL();
    link.click();

    setDownloadDialogOpen(false);
  };

  const handlePrint = async () => {
    if (!printCanvasRef.current) return;

    await generateQRCode(printCanvasRef.current, selectedColor);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const imageUrl = printCanvasRef.current.toDataURL();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${item.barcode}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .qr-container {
              text-align: center;
              page-break-inside: avoid;
            }
            img {
              max-width: 400px;
              height: auto;
            }
            .barcode-text {
              margin-top: 16px;
              font-family: monospace;
              font-size: 18px;
              font-weight: 600;
            }
            .item-name {
              margin-top: 8px;
              font-size: 16px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${imageUrl}" alt="QR Code" />
            <div class="barcode-text">${item.barcode}</div>
            <div class="item-name">${item.name}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    setPrintDialogOpen(false);
  };

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
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Item Name</dt>
                <dd className="font-medium text-lg">{item.name}</dd>
              </div>
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

            <div className="flex gap-2 w-full">
              <Dialog
                open={downloadDialogOpen}
                onOpenChange={setDownloadDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Download QR Code</DialogTitle>
                    <DialogDescription>
                      Select a color for your QR code before downloading
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>QR Code Color</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {colorOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedColor(option.value)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedColor === option.value
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                            }`}
                            style={{
                              backgroundColor:
                                option.value === "#ffffff"
                                  ? "#f3f4f6"
                                  : option.value,
                            }}
                          >
                            <span className="sr-only">{option.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected:{" "}
                        {
                          colorOptions.find((c) => c.value === selectedColor)
                            ?.label
                        }
                      </p>
                    </div>
                    <div className="flex justify-center p-4 bg-secondary rounded-lg">
                      <canvas ref={downloadCanvasRef} className="hidden" />
                      <div className="text-center text-sm text-muted-foreground">
                        Preview will be generated on download
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDownloadDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleDownload} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Print QR Code</DialogTitle>
                    <DialogDescription>
                      Select a color for your QR code before printing
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>QR Code Color</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {colorOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedColor(option.value)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedColor === option.value
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                            }`}
                            style={{
                              backgroundColor:
                                option.value === "#ffffff"
                                  ? "#f3f4f6"
                                  : option.value,
                            }}
                          >
                            <span className="sr-only">{option.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected:{" "}
                        {
                          colorOptions.find((c) => c.value === selectedColor)
                            ?.label
                        }
                      </p>
                    </div>
                    <div className="flex justify-center p-4 bg-secondary rounded-lg">
                      <canvas ref={printCanvasRef} className="hidden" />
                      <div className="text-center text-sm text-muted-foreground">
                        Preview will be generated on print
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPrintDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handlePrint} className="flex-1">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
