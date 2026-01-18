"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type {
  KnowledgeArticle,
  ArticleStatus,
  ArticleCategory,
  KnowledgeSearchFilters,
} from "@/lib/models/Knowledge";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth";
import { hasPermission } from "../models/User";

// Helper function to create URL-friendly slug
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Serialized version for client components
export interface KnowledgeArticleSerialized {
  _id: string;
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
  relatedArticles?: string[];
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  lastEditedBy?: string;
}

export async function createArticle(data: {
  title: string;
  content: string;
  summary?: string;
  category: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  authorId: string;
  authorName: string;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
}): Promise<{
  success: boolean;
  article?: KnowledgeArticleSerialized;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "knowledge", "create")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    const slug = createSlug(data.title);

    // Check if slug already exists and make it unique if needed
    let finalSlug = slug;
    let counter = 1;
    while (await collection.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const now = new Date();
    const article: KnowledgeArticle = {
      title: data.title,
      slug: finalSlug,
      content: data.content,
      summary: data.summary,
      category: data.category,
      tags: data.tags,
      status: data.status,
      authorId: data.authorId,
      authorName: data.authorName,
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      attachments: data.attachments || [],
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "published" ? now : undefined,
    };

    const result = await collection.insertOne(article);
    article._id = result.insertedId;

    const serialized: KnowledgeArticleSerialized = {
      _id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary,
      category: article.category,
      tags: article.tags,
      status: article.status,
      authorId: article.authorId,
      authorName: article.authorName,
      viewCount: article.viewCount,
      helpfulCount: article.helpfulCount,
      notHelpfulCount: article.notHelpfulCount,
      relatedArticles: article.relatedArticles,
      attachments: article.attachments,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      lastEditedBy: article.lastEditedBy,
    };

    revalidatePath("/knowledgebase");
    return { success: true, article: serialized };
  } catch (error) {
    console.error("Error creating article:", error);
    return { success: false, error: "Failed to create article" };
  }
}

export async function getArticles(filters?: KnowledgeSearchFilters): Promise<{
  success: boolean;
  data?: KnowledgeArticleSerialized[];
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    // Build query
    const query: any = {};

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.status) {
      query.status = filters.status;
    } else {
      // By default, only show published articles unless explicitly filtered
      query.status = "published";
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters?.authorId) {
      query.authorId = filters.authorId;
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { content: { $regex: filters.search, $options: "i" } },
        { tags: { $regex: filters.search, $options: "i" } },
      ];
    }

    const articles = await collection
      .find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray();

    const serialized: KnowledgeArticleSerialized[] = articles.map(
      (article) => ({
        _id: article._id!.toString(),
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.summary,
        category: article.category,
        tags: article.tags,
        status: article.status,
        authorId: article.authorId,
        authorName: article.authorName,
        viewCount: article.viewCount,
        helpfulCount: article.helpfulCount,
        notHelpfulCount: article.notHelpfulCount,
        relatedArticles: article.relatedArticles,
        attachments: article.attachments,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString(),
        lastEditedBy: article.lastEditedBy,
      }),
    );

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching articles:", error);
    return { success: false, error: "Failed to fetch articles" };
  }
}

export async function getArticleById(id: string): Promise<{
  success: boolean;
  data?: KnowledgeArticleSerialized;
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");
    const article = await collection.findOne({ _id: new ObjectId(id) });

    if (!article) {
      return { success: false, error: "Article not found" };
    }

    const serialized: KnowledgeArticleSerialized = {
      _id: article._id!.toString(),
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary,
      category: article.category,
      tags: article.tags,
      status: article.status,
      authorId: article.authorId,
      authorName: article.authorName,
      viewCount: article.viewCount,
      helpfulCount: article.helpfulCount,
      notHelpfulCount: article.notHelpfulCount,
      relatedArticles: article.relatedArticles,
      attachments: article.attachments,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      lastEditedBy: article.lastEditedBy,
    };

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching article:", error);
    return { success: false, error: "Failed to fetch article" };
  }
}

export async function getArticleBySlug(slug: string): Promise<{
  success: boolean;
  data?: KnowledgeArticleSerialized;
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");
    const article = await collection.findOne({ slug });

    if (!article) {
      return { success: false, error: "Article not found" };
    }

    const serialized: KnowledgeArticleSerialized = {
      _id: article._id!.toString(),
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary,
      category: article.category,
      tags: article.tags,
      status: article.status,
      authorId: article.authorId,
      authorName: article.authorName,
      viewCount: article.viewCount,
      helpfulCount: article.helpfulCount,
      notHelpfulCount: article.notHelpfulCount,
      relatedArticles: article.relatedArticles,
      attachments: article.attachments,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      lastEditedBy: article.lastEditedBy,
    };

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching article:", error);
    return { success: false, error: "Failed to fetch article" };
  }
}

export async function updateArticle(
  id: string,
  data: {
    title?: string;
    content?: string;
    summary?: string;
    category?: ArticleCategory;
    tags?: string[];
    status?: ArticleStatus;
    lastEditedBy?: string;
    attachments?: {
      name: string;
      url: string;
      size: number;
      type: string;
    }[];
  },
): Promise<{
  success: boolean;
  article?: KnowledgeArticleSerialized;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "knowledge", "update")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title) {
      updateData.title = data.title;
      updateData.slug = createSlug(data.title);
    }
    if (data.content !== undefined) updateData.content = data.content;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.category) updateData.category = data.category;
    if (data.tags) updateData.tags = data.tags;
    if (data.attachments !== undefined)
      updateData.attachments = data.attachments;
    if (data.lastEditedBy) updateData.lastEditedBy = data.lastEditedBy;

    // If changing status to published and it wasn't published before
    if (data.status) {
      const currentArticle = await collection.findOne({
        _id: new ObjectId(id),
      });
      if (
        data.status === "published" &&
        currentArticle?.status !== "published"
      ) {
        updateData.publishedAt = new Date();
      }
      updateData.status = data.status;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return { success: false, error: "Article not found" };
    }

    const serialized: KnowledgeArticleSerialized = {
      _id: result._id!.toString(),
      title: result.title,
      slug: result.slug,
      content: result.content,
      summary: result.summary,
      category: result.category,
      tags: result.tags,
      status: result.status,
      authorId: result.authorId,
      authorName: result.authorName,
      viewCount: result.viewCount,
      helpfulCount: result.helpfulCount,
      notHelpfulCount: result.notHelpfulCount,
      relatedArticles: result.relatedArticles,
      attachments: result.attachments,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      publishedAt: result.publishedAt?.toISOString(),
      lastEditedBy: result.lastEditedBy,
    };

    revalidatePath("/knowledgebase");
    revalidatePath(`/knowledgebase/${id}`);
    return { success: true, article: serialized };
  } catch (error) {
    console.error("Error updating article:", error);
    return { success: false, error: "Failed to update article" };
  }
}

export async function deleteArticle(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "knowledge", "delete")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return { success: false, error: "Article not found" };
    }

    revalidatePath("/knowledgebase");
    return { success: true };
  } catch (error) {
    console.error("Error deleting article:", error);
    return { success: false, error: "Failed to delete article" };
  }
}

export async function incrementViewCount(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { viewCount: 1 } },
    );

    return { success: true };
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return { success: false, error: "Failed to update view count" };
  }
}

export async function markArticleHelpful(
  id: string,
  helpful: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    const field = helpful ? "helpfulCount" : "notHelpfulCount";
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { [field]: 1 } },
    );

    revalidatePath(`/knowledgebase/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error marking article helpful:", error);
    return { success: false, error: "Failed to update helpful count" };
  }
}

export async function getPopularArticles(limit: number = 5): Promise<{
  success: boolean;
  data?: KnowledgeArticleSerialized[];
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    const articles = await collection
      .find({ status: "published" })
      .sort({ viewCount: -1 })
      .limit(limit)
      .toArray();

    const serialized: KnowledgeArticleSerialized[] = articles.map(
      (article) => ({
        _id: article._id!.toString(),
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.summary,
        category: article.category,
        tags: article.tags,
        status: article.status,
        authorId: article.authorId,
        authorName: article.authorName,
        viewCount: article.viewCount,
        helpfulCount: article.helpfulCount,
        notHelpfulCount: article.notHelpfulCount,
        relatedArticles: article.relatedArticles,
        attachments: article.attachments,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString(),
        lastEditedBy: article.lastEditedBy,
      }),
    );

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching popular articles:", error);
    return { success: false, error: "Failed to fetch popular articles" };
  }
}

export async function getRelatedArticles(
  articleId: string,
  limit: number = 5,
): Promise<{
  success: boolean;
  data?: KnowledgeArticleSerialized[];
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    // Get the current article to find related ones
    const currentArticle = await collection.findOne({
      _id: new ObjectId(articleId),
    });

    if (!currentArticle) {
      return { success: false, error: "Article not found" };
    }

    // Find articles with similar tags or same category
    const articles = await collection
      .find({
        _id: { $ne: new ObjectId(articleId) },
        status: "published",
        $or: [
          { category: currentArticle.category },
          { tags: { $in: currentArticle.tags } },
        ],
      })
      .sort({ viewCount: -1 })
      .limit(limit)
      .toArray();

    const serialized: KnowledgeArticleSerialized[] = articles.map(
      (article) => ({
        _id: article._id!.toString(),
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.summary,
        category: article.category,
        tags: article.tags,
        status: article.status,
        authorId: article.authorId,
        authorName: article.authorName,
        viewCount: article.viewCount,
        helpfulCount: article.helpfulCount,
        notHelpfulCount: article.notHelpfulCount,
        relatedArticles: article.relatedArticles,
        attachments: article.attachments,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString(),
        lastEditedBy: article.lastEditedBy,
      }),
    );

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching related articles:", error);
    return { success: false, error: "Failed to fetch related articles" };
  }
}

export async function getAllTags(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<KnowledgeArticle>("knowledge");

    const tags = await collection.distinct("tags", { status: "published" });

    return { success: true, data: tags.sort() };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return { success: false, error: "Failed to fetch tags" };
  }
}
