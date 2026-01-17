"use client";

import { useState, useTransition, useEffect } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateInventoryItem } from "@/lib/actions/inventory";
import { getCategories } from "@/lib/actions/categories";
import type {
  InventoryItemWithCategorySerialized,
  CategorySerialized,
  ItemStatus,
} from "@/lib/models/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditItemDialogProps {
  item: InventoryItemWithCategorySerialized;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditItemDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: EditItemDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<CategorySerialized[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateInventoryItem(item._id!, {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        categoryId: formData.get("categoryId") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        serialNumber: formData.get("serialNumber") as string,
        status: formData.get("status") as ItemStatus,
        purchaseDate: formData.get("purchaseDate") as string,
        purchasePrice: formData.get("purchasePrice")
          ? Number(formData.get("purchasePrice"))
          : undefined,
        warrantyExpiry: formData.get("warrantyExpiry") as string,
        location: formData.get("location") as string,
        notes: formData.get("notes") as string,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Inventory item updated successfully",
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update inventory item",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update the details of the inventory item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                name="name"
                required
                defaultValue={item.name}
                className="bg-secondary"
                placeholder="e.g., Dell Latitude 5520"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-categoryId">Category *</Label>
              <Select
                name="categoryId"
                required
                disabled={loadingCategories}
                defaultValue={item.categoryId}
              >
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

            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                name="brand"
                defaultValue={item.brand || ""}
                className="bg-secondary"
                placeholder="e.g., Dell"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                name="model"
                defaultValue={item.model || ""}
                className="bg-secondary"
                placeholder="e.g., Latitude 5520"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-serialNumber">Serial Number</Label>
              <Input
                id="edit-serialNumber"
                name="serialNumber"
                defaultValue={item.serialNumber || ""}
                className="bg-secondary"
                placeholder="Enter serial number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select name="status" required defaultValue={item.status}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
              <Input
                id="edit-purchaseDate"
                name="purchaseDate"
                type="date"
                defaultValue={
                  item.purchaseDate ? item.purchaseDate.split("T")[0] : ""
                }
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-purchasePrice">Purchase Price</Label>
              <Input
                id="edit-purchasePrice"
                name="purchasePrice"
                type="number"
                step="0.01"
                defaultValue={item.purchasePrice || ""}
                className="bg-secondary"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="edit-warrantyExpiry"
                name="warrantyExpiry"
                type="date"
                defaultValue={
                  item.warrantyExpiry ? item.warrantyExpiry.split("T")[0] : ""
                }
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                name="location"
                defaultValue={item.location || ""}
                className="bg-secondary"
                placeholder="e.g., IT Storage Room A"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={item.description || ""}
              className="bg-secondary"
              placeholder="Additional details about the item"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              defaultValue={item.notes || ""}
              className="bg-secondary"
              placeholder="Any additional notes"
              rows={3}
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
              Update Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
