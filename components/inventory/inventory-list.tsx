"use client";

import { useState, useTransition, useEffect } from "react";
import type {
  InventoryItemWithCategorySerialized,
  ItemStatus,
  CategorySerialized,
} from "@/lib/models/types";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, QrCode, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  getInventoryItems,
  deleteInventoryItem,
} from "@/lib/actions/inventory";
import { getCategories } from "@/lib/actions/categories";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditItemDialog } from "@/components/inventory/edit-item-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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

export function InventoryList({
  initialItems,
}: {
  initialItems: InventoryItemWithCategorySerialized[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<CategorySerialized[]>([]);
  const [isPending, startTransition] = useTransition();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<InventoryItemWithCategorySerialized | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<InventoryItemWithCategorySerialized | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const result = await getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    };
    fetchCategories();
  }, []);

  const handleFilterChange = (
    newSearch: string,
    newStatus: string,
    newCategory: string
  ) => {
    startTransition(async () => {
      const filters: {
        status?: ItemStatus;
        categoryId?: string;
        search?: string;
      } = {};
      if (newStatus !== "all") filters.status = newStatus as ItemStatus;
      if (newCategory !== "all") filters.categoryId = newCategory;
      if (newSearch) filters.search = newSearch;

      const filtered = await getInventoryItems(filters);
      setItems(filtered);
    });
  };

  const handleEdit = (item: InventoryItemWithCategorySerialized) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (item: InventoryItemWithCategorySerialized) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    startTransition(async () => {
      const result = await deleteInventoryItem(itemToDelete._id!);
      if (result.success) {
        toast({
          title: "Success",
          description: "Inventory item marked as disposed",
        });
        // Refresh the list
        const filters: {
          status?: ItemStatus;
          categoryId?: string;
          search?: string;
        } = {};
        if (statusFilter !== "all") filters.status = statusFilter as ItemStatus;
        if (categoryFilter !== "all") filters.categoryId = categoryFilter;
        if (search) filters.search = search;
        const filtered = await getInventoryItems(filters);
        setItems(filtered);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete inventory item",
        });
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    });
  };

  const refreshItems = async () => {
    const filters: {
      status?: ItemStatus;
      categoryId?: string;
      search?: string;
    } = {};
    if (statusFilter !== "all") filters.status = statusFilter as ItemStatus;
    if (categoryFilter !== "all") filters.categoryId = categoryFilter;
    if (search) filters.search = search;
    const filtered = await getInventoryItems(filters);
    setItems(filtered);
  };

  const showQrCode = (barcode: string) => {
    setSelectedBarcode(barcode);
    setQrDialogOpen(true);
  };

  const columns = [
    {
      key: "barcode",
      header: "Barcode",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => showQrCode(item.barcode)}
            className="text-primary hover:underline font-mono text-sm flex items-center gap-1"
          >
            <QrCode className="h-4 w-4" />
            {item.barcode}
          </button>
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <div>
          <p className="font-medium">{item.name}</p>
          {item.brand && (
            <p className="text-xs text-muted-foreground">
              {item.brand} {item.model}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <span className="text-sm">{item.category?.name || "N/A"}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <StatusBadge variant={statusVariants[item.status]}>
          {item.status.replace("_", " ")}
        </StatusBadge>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <span className="text-sm text-muted-foreground">
          {item.location || "-"}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item: InventoryItemWithCategorySerialized) => (
        <div className="flex items-center gap-1">
          <Link href={`/inventory/${item._id}`}>
            <Button variant="ghost" size="sm" title="View Details">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            title="Edit Item"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(item)}
            title="Delete Item"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-[120px]",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            handleFilterChange(search, value, categoryFilter);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="under_repair">Under Repair</SelectItem>
            <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value);
            handleFilterChange(search, statusFilter, value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id!}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search by name, barcode, or serial number..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          handleFilterChange(value, statusFilter, categoryFilter);
        }}
        emptyMessage={isPending ? "Loading..." : "No inventory items found"}
      />

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <BarcodeDisplay value={selectedBarcode} type="qr" size={200} />
            <p className="font-mono text-sm">{selectedBarcode}</p>
          </div>
        </DialogContent>
      </Dialog>

      {selectedItem && (
        <EditItemDialog
          item={selectedItem}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={refreshItems}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This will mark the item
              as "Disposed" and it will no longer be available for use.
              {itemToDelete && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="font-semibold">{itemToDelete.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {itemToDelete.barcode}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
