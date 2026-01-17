"use client";

import type React from "react";

import { useState, useTransition, useEffect, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createIssuance } from "@/lib/actions/issuance";
import type {
  InventoryItemWithCategorySerialized,
  EmployeeWithDepartmentSerialized,
  Department,
} from "@/lib/models/types";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import { getInventoryItemByBarcode } from "@/lib/actions/inventory";

interface IssueItemFormProps {
  availableItems: InventoryItemWithCategorySerialized[];
  employees: EmployeeWithDepartmentSerialized[];
  departments: Department[];
  currentUserName: string;
  preSelectedItemId?: string;
}

export function IssueItemForm({
  availableItems,
  employees,
  departments,
  currentUserName,
  preSelectedItemId,
}: IssueItemFormProps) {
  const router = useRouter();
  
  // Find pre-selected item from availableItems
  const preSelectedItem = useMemo(() => {
    if (preSelectedItemId && availableItems.length > 0) {
      return availableItems.find((item) => item._id === preSelectedItemId) || null;
    }
    return null;
  }, [preSelectedItemId, availableItems]);
  
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>(preSelectedItemId || "");
  const [issuedToType, setIssuedToType] = useState<"employee" | "department">(
    "employee",
  );
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [scannedItem, setScannedItem] =
    useState<InventoryItemWithCategorySerialized | null>(preSelectedItem);

  // Sync when preSelectedItem changes
  useEffect(() => {
    if (preSelectedItem && !scannedItem) {
      setSelectedItem(preSelectedItemId || "");
      setScannedItem(preSelectedItem);
    }
  }, [preSelectedItem, preSelectedItemId, scannedItem]);

  const handleBarcodeScanned = async (barcode: string) => {
    const item = await getInventoryItemByBarcode(barcode);
    if (item) {
      if (item.status === "in_stock") {
        const itemId = item._id?.toString() || "";
        setSelectedItem(itemId);
        // Convert to match the serialized format for display
        setScannedItem({
          ...item,
          _id: itemId,
          categoryId: item.categoryId?.toString() || "",
          createdAt:
            item.createdAt?.toISOString?.() || new Date().toISOString(),
          updatedAt:
            item.updatedAt?.toISOString?.() || new Date().toISOString(),
          purchaseDate: item.purchaseDate?.toISOString?.(),
          warrantyExpiry: item.warrantyExpiry?.toISOString?.(),
          category: { _id: "", name: "Unknown", code: "" },
        } as InventoryItemWithCategorySerialized);
        setError(null);
      } else {
        setError(`Item ${barcode} is not available (Status: ${item.status})`);
        setScannedItem(null);
      }
    } else {
      setError(`Item with barcode ${barcode} not found`);
      setScannedItem(null);
    }
  };

  const getRecipientName = () => {
    if (issuedToType === "employee") {
      const employee = employees.find(
        (e) => e._id?.toString() === selectedRecipient,
      );
      if (!employee) return "";
      return `${employee.firstName} ${
        employee.middleName ? employee.middleName + " " : ""
      }${employee.lastName}`;
    } else {
      const department = departments.find(
        (d) => d._id?.toString() === selectedRecipient,
      );
      return department?.name || "";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const itemId = selectedItem || scannedItem?._id;

    if (!itemId) {
      setError("Please select or scan an item");
      return;
    }

    if (!selectedRecipient) {
      setError("Please select a recipient");
      return;
    }

    startTransition(async () => {
      const result = await createIssuance({
        itemId,
        issuedToType,
        issuedToId: selectedRecipient,
        issuedToName: getRecipientName(),
        issuedBy: formData.get("issuedBy") as string,
        expectedReturn: formData.get("expectedReturn") as string,
        notes: formData.get("notes") as string,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to create issuance");
      }
    });
  };

  if (success) {
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
                Item Issued Successfully
              </h2>
              <p className="text-muted-foreground mt-1">
                The item has been issued to the recipient
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setSelectedItem("");
                  setSelectedRecipient("");
                  setScannedItem(null);
                }}
              >
                Issue Another Item
              </Button>
              <Button onClick={() => router.push("/issuance")}>
                View All Issuances
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
            <CardTitle className="text-lg">Select Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Scan Barcode</Label>
              <BarcodeScanner
                onScan={handleBarcodeScanned}
                placeholder="Enter or scan item barcode..."
              />
            </div>

            {scannedItem && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <p className="font-medium">{scannedItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  {scannedItem.barcode}
                </p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  or select from list
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available Items</Label>
              <Select
                value={selectedItem}
                onValueChange={(value) => {
                  setSelectedItem(value);
                  setScannedItem(null);
                }}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item._id} value={item._id!}>
                      {item.name} ({item.barcode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableItems.length === 0 && !scannedItem && (
              <p className="text-sm text-muted-foreground">
                No items available in stock
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recipient Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Issue To</Label>
              <RadioGroup
                value={issuedToType}
                onValueChange={(value) => {
                  setIssuedToType(value as "employee" | "department");
                  setSelectedRecipient("");
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="employee" id="employee" />
                  <Label htmlFor="employee" className="font-normal">
                    Employee
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="department" id="department" />
                  <Label htmlFor="department" className="font-normal">
                    Department
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>
                {issuedToType === "employee"
                  ? "Select Employee"
                  : "Select Department"}{" "}
                *
              </Label>
              <Select
                value={selectedRecipient}
                onValueChange={setSelectedRecipient}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder={`Select ${issuedToType}`} />
                </SelectTrigger>
                <SelectContent>
                  {issuedToType === "employee"
                    ? employees.map((emp) => (
                        <SelectItem
                          key={emp._id?.toString()}
                          value={emp._id!.toString()}
                        >
                          {emp.firstName}{" "}
                          {emp.middleName ? emp.middleName + " " : ""}
                          {emp.lastName}{" "}
                          {emp.department ? `(${emp.department.name})` : ""}
                        </SelectItem>
                      ))
                    : departments.map((dept) => (
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

            <div className="space-y-2">
              <Label htmlFor="issuedBy">Issued By *</Label>
              <Input
                id="issuedBy"
                name="issuedBy"
                required
                className="bg-secondary"
                placeholder="Your name"
                defaultValue={currentUserName}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedReturn">Expected Return Date</Label>
              <Input
                id="expectedReturn"
                name="expectedReturn"
                type="date"
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                className="bg-secondary"
                placeholder="Any additional notes about this issuance"
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
        <Link href="/issuance">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Issue Item
        </Button>
      </div>
    </form>
  );
}
