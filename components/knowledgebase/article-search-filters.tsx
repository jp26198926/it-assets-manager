"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import type { ArticleCategory, ArticleStatus } from "@/lib/models/Knowledge";
import { ARTICLE_CATEGORIES, ARTICLE_STATUSES } from "@/lib/models/Knowledge";

interface ArticleSearchFiltersProps {
  selectedCategory?: ArticleCategory;
  selectedStatus?: ArticleStatus;
  selectedTags: string[];
  onCategoryChange: (category?: ArticleCategory) => void;
  onStatusChange: (status?: ArticleStatus) => void;
  onTagsChange: (tags: string[]) => void;
  showStatusFilter?: boolean;
}

export function ArticleSearchFilters({
  selectedCategory,
  selectedStatus,
  selectedTags,
  onCategoryChange,
  onStatusChange,
  onTagsChange,
  showStatusFilter = false,
}: ArticleSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    selectedCategory || selectedStatus || selectedTags.length > 0;

  const clearAllFilters = () => {
    onCategoryChange(undefined);
    onStatusChange(undefined);
    onTagsChange([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge
              variant="destructive"
              className="ml-2 px-1 min-w-5 h-5 flex items-center justify-center"
            >
              {(selectedCategory ? 1 : 0) +
                (selectedStatus ? 1 : 0) +
                selectedTags.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 px-2"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) =>
                  onCategoryChange(
                    value === "all" ? undefined : (value as ArticleCategory),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {ARTICLE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showStatusFilter && (
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={selectedStatus || "all"}
                  onValueChange={(value) =>
                    onStatusChange(
                      value === "all" ? undefined : (value as ArticleStatus),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {ARTICLE_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCategory && (
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedCategory}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCategoryChange(undefined)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
