"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { ArticleList } from "./article-list";
import { ArticleSearchFilters } from "./article-search-filters";
import type { KnowledgeArticleSerialized } from "@/lib/actions/knowledge";
import type { ArticleCategory, ArticleStatus } from "@/lib/models/Knowledge";
import { Input } from "@/components/ui/input";

interface KnowledgebasePageContentProps {
  initialArticles: KnowledgeArticleSerialized[];
  userRole?: string;
}

export function KnowledgebasePageContent({
  initialArticles,
  userRole,
}: KnowledgebasePageContentProps) {
  const [articles, setArticles] =
    useState<KnowledgeArticleSerialized[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ArticleCategory | undefined
  >();
  const [selectedStatus, setSelectedStatus] = useState<
    ArticleStatus | undefined
  >();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredArticles = articles.filter((article) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory && article.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus && article.status !== selectedStatus) {
      return false;
    }

    // Tags filter
    if (
      selectedTags.length > 0 &&
      !selectedTags.some((tag) => article.tags.includes(tag))
    ) {
      return false;
    }

    return true;
  });

  const canCreateArticle = userRole === "admin" || userRole === "manager";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Browse and search help articles and documentation
          </p>
        </div>
        {canCreateArticle && (
          <Link href="/knowledgebase/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Article
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 flex-col md:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <ArticleSearchFilters
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          selectedTags={selectedTags}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onTagsChange={setSelectedTags}
          showStatusFilter={userRole === "admin" || userRole === "manager"}
        />
      </div>

      <ArticleList articles={filteredArticles} />

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No articles found matching your criteria
          </p>
        </div>
      )}
    </div>
  );
}
