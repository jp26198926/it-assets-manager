"use client";

import type React from "react";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInventoryItem } from "@/lib/actions/inventory";
import { getCategories } from "@/lib/actions/categories";
import type { CategorySerialized } from "@/lib/models/types";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";
import { CheckCircle2, Loader2, Printer } from "lucide-react";
import QRCode from "qrcode";

export function ReceiveItemForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null);
  const [generatedItemName, setGeneratedItemName] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategorySerialized[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
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

  useEffect(() => {
    const fetchCategories = async () => {
      const result = await getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      }
      setLoadingCategories(false);
    };
    fetchCategories();
  }, []);

  const generateQRCode = async (
    canvas: HTMLCanvasElement | null,
    color: string,
  ) => {
    if (!canvas || !generatedBarcode) return;

    await QRCode.toCanvas(canvas, generatedBarcode, {
      width: 400,
      margin: 2,
      color: {
        dark: color,
        light: "#00000000",
      },
    });
  };

  const handlePrint = async () => {
    if (!printCanvasRef.current || !generatedBarcode) return;

    await generateQRCode(printCanvasRef.current, selectedColor);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const imageUrl = printCanvasRef.current.toDataURL();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${generatedBarcode}</title>
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
            <div class="barcode-text">${generatedBarcode}</div>
            <div class="item-name">${generatedItemName || ""}</div>
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createInventoryItem({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        categoryId: formData.get("categoryId") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        serialNumber: formData.get("serialNumber") as string,
        purchaseDate: formData.get("purchaseDate") as string,
        purchasePrice: formData.get("purchasePrice")
          ? Number(formData.get("purchasePrice"))
          : undefined,
        warrantyExpiry: formData.get("warrantyExpiry") as string,
        location: formData.get("location") as string,
        notes: formData.get("notes") as string,
      });

      if (result.success && result.item) {
        setSuccess(true);
        setGeneratedBarcode(result.item.barcode);
        setGeneratedItemName(result.item.name);
      } else {
        setError(result.error || "Failed to create item");
      }
    });
  };

  if (success && generatedBarcode) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-success/20 p-3">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Item Registered Successfully
              </h2>
              <p className="text-muted-foreground mt-1">
                A barcode has been generated for this item
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 py-4">
              <BarcodeDisplay value={generatedBarcode} type="qr" size={200} />
              <p className="font-mono text-lg">{generatedBarcode}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Barcode
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
                            type="button"
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
                        type="button"
                        variant="outline"
                        onClick={() => setPrintDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handlePrint}
                        className="flex-1"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setGeneratedBarcode(null);
                  setGeneratedItemName(null);
                }}
              >
                Register Another Item
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/inventory")}
              >
                View Inventory
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                required
                className="bg-secondary"
                placeholder="e.g., Dell Latitude 5520"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select name="categoryId" required disabled={loadingCategories}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue
                    placeholder={
                      loadingCategories
                        ? "Loading categories..."
                        : "Select category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id!}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  name="brand"
                  className="bg-secondary"
                  placeholder="e.g., Dell"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  className="bg-secondary"
                  placeholder="e.g., Latitude 5520"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                className="bg-secondary"
                placeholder="Enter serial number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                className="bg-secondary"
                placeholder="Additional details about the item"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                step="0.01"
                className="bg-secondary"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="warrantyExpiry"
                name="warrantyExpiry"
                type="date"
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                className="bg-secondary"
                placeholder="e.g., IT Storage Room A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                className="bg-secondary"
                placeholder="Any additional notes"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-destructive/20 border border-destructive/30 rounded-lg text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Register Item & Generate Barcode
        </Button>
      </div>
    </form>
  );
}
