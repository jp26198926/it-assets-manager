"use client";

import type React from "react";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTicket } from "@/lib/actions/tickets";
import { getInventoryItemByBarcode } from "@/lib/actions/inventory";
import { getDepartments } from "@/lib/actions/employees";
import type {
  InventoryItem,
  TicketPriority,
  Department,
} from "@/lib/models/types";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Upload,
  FileIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import { RichTextEditor } from "@/components/knowledgebase/rich-text-editor";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "Hardware Issue",
  "Software Issue",
  "Network Issue",
  "Account/Access",
  "Email",
  "Printer",
  "Other",
];

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface CreateTicketFormProps {
  availableItems: InventoryItem[];
  currentUser?: {
    id: string;
    name: string;
    email: string;
    departmentId?: string;
  } | null;
}

export function CreateTicketForm({
  availableItems,
  currentUser,
}: CreateTicketFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [category, setCategory] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    currentUser?.departmentId || "",
  );
  const [description, setDescription] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [reporterName, setReporterName] = useState<string>(
    currentUser?.name || "",
  );
  const [reporterEmail, setReporterEmail] = useState<string>(
    currentUser?.email || "",
  );

  useEffect(() => {
    const fetchDepartments = async () => {
      const result = await getDepartments();
      if (result.success && result.data) {
        setDepartments(result.data);
      }
    };
    fetchDepartments();
  }, []);

  const handleBarcodeScanned = async (barcode: string) => {
    const item = await getInventoryItemByBarcode(barcode);
    if (item) {
      setScannedItem(item);
      setSelectedItem(item._id!.toString());
      setError(null);
    } else {
      setError(`Item with barcode ${barcode} not found`);
      setScannedItem(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAttachments([
          ...attachments,
          {
            name: data.filename,
            url: data.url,
            size: data.size,
            type: data.type,
          },
        ]);
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (urlToRemove: string) => {
    setAttachments(attachments.filter((att) => att.url !== urlToRemove));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const itemId = selectedItem || scannedItem?._id?.toString();

    let itemInfo: { itemId?: string; itemBarcode?: string; itemName?: string } =
      {};
    if (itemId) {
      const item =
        scannedItem || availableItems.find((i) => i._id?.toString() === itemId);
      if (item) {
        itemInfo = {
          itemId,
          itemBarcode: item.barcode,
          itemName: item.name,
        };
      }
    }

    startTransition(async () => {
      const result = await createTicket({
        title: formData.get("title") as string,
        description: description,
        priority,
        category,
        reportedBy: {
          name: formData.get("reporterName") as string,
          email: formData.get("reporterEmail") as string,
          departmentId: selectedDepartment || undefined,
        },
        attachments,
        ...itemInfo,
      });

      if (result.success && result.ticket) {
        setSuccess(true);
        setCreatedTicketNumber(result.ticket.ticketNumber);
      } else {
        setError(result.error || "Failed to create ticket");
      }
    });
  };

  if (success && createdTicketNumber) {
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
                Ticket Created Successfully
              </h2>
              <p className="text-muted-foreground mt-1">
                Your ticket number is:
              </p>
              <p className="text-2xl font-mono font-bold mt-2">
                {createdTicketNumber}
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setCreatedTicketNumber(null);
                  setSelectedItem("");
                  setScannedItem(null);
                  setDescription("");
                  setAttachments([]);
                }}
              >
                Create Another Ticket
              </Button>
              <Button onClick={() => router.push("/tickets")}>
                View All Tickets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  className="bg-secondary"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as TicketPriority)
                  }
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Detailed description of the issue..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">File Attachments</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Click to upload files or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 10MB
                    </p>
                    <Input
                      id="attachments"
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="mt-2"
                    />
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.url}
                          className="flex items-center justify-between p-2 bg-muted rounded-md"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileIcon className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveAttachment(attachment.url)
                            }
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reporter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reporterName">Your Name *</Label>
                <Input
                  id="reporterName"
                  name="reporterName"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  required
                  className="bg-secondary"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporterEmail">Email *</Label>
                <Input
                  id="reporterEmail"
                  name="reporterEmail"
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  required
                  className="bg-secondary"
                  placeholder="john@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporterDepartment">Department</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept._id?.toString()}
                        value={dept._id!.toString()}
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Item (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Scan Item Barcode</Label>
                <BarcodeScanner
                  onScan={handleBarcodeScanned}
                  placeholder="Scan item for repair..."
                />
              </div>

              {scannedItem && (
                <div className="p-4 rounded-lg bg-info/10 border border-info/30">
                  <p className="font-medium">{scannedItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {scannedItem.barcode}
                  </p>
                </div>
              )}

              {!scannedItem && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        or select
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Item</Label>
                    <Select
                      value={selectedItem}
                      onValueChange={setSelectedItem}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select an item (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No item</SelectItem>
                        {availableItems.map((item) => (
                          <SelectItem
                            key={item._id?.toString()}
                            value={item._id!.toString()}
                          >
                            {item.name} ({item.barcode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-destructive/20 border border-destructive/30 rounded-lg text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4 mt-6">
        <Link href="/tickets">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isPending || !category}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Ticket
        </Button>
      </div>
    </form>
  );
}
