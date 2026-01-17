import type { ObjectId } from "mongodb";

export type ArticleStatus = "draft" | "published" | "archived";
export type ArticleCategory =
  | "hardware"
  | "software"
  | "network"
  | "security"
  | "procedures"
  | "troubleshooting"
  | "faq"
  | "general";

export interface KnowledgeArticle {
  _id?: ObjectId;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  authorId: string;
  authorName: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedArticles?: string[]; // Array of article IDs
  attachments?: {
    name: string;
    url: string;
    size: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  lastEditedBy?: string;
}

export interface KnowledgeSearchFilters {
  category?: ArticleCategory;
  status?: ArticleStatus;
  tags?: string[];
  search?: string;
  authorId?: string;
}

export const ARTICLE_CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "network", label: "Network" },
  { value: "security", label: "Security" },
  { value: "procedures", label: "Procedures" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "faq", label: "FAQ" },
  { value: "general", label: "General" },
];

export const ARTICLE_STATUSES: { value: ArticleStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
