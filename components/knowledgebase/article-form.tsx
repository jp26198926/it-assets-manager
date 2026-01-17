"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileIcon } from "lucide-react";
import { createArticle, updateArticle } from "@/lib/actions/knowledge";
import type { KnowledgeArticleSerialized } from "@/lib/actions/knowledge";
import type { ArticleCategory, ArticleStatus } from "@/lib/models/Knowledge";
import { ARTICLE_CATEGORIES, ARTICLE_STATUSES } from "@/lib/models/Knowledge";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "./rich-text-editor";

interface ArticleFormProps {
  article?: KnowledgeArticleSerialized;
  authorId: string;
  authorName: string;
}

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function ArticleForm({
  article,
  authorId,
  authorName,
}: ArticleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: article?.title || "",
    content: article?.content || "",
    category: article?.category || ("general" as ArticleCategory),
    status: article?.status || ("draft" as ArticleStatus),
  });

  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>(
    article?.attachments || [],
  );
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
      // Reset input
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (article) {
        // Update existing article
        const result = await updateArticle(article._id, {
          ...formData,
          tags,
          attachments,
          lastEditedBy: authorName,
        });

        if (result.success) {
          toast({
            title: "Success",
            description: "Article updated successfully",
          });
          router.push(`/knowledgebase/${article._id}`);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update article",
            variant: "destructive",
          });
        }
      } else {
        // Create new article
        const result = await createArticle({
          ...formData,
          tags,
          attachments,
          authorId,
          authorName,
        });

        if (result.success && result.article) {
          toast({
            title: "Success",
            description: "Article created successfully",
          });
          router.push(`/knowledgebase/${result.article._id}`);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create article",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter article title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <RichTextEditor
          content={formData.content}
          onChange={(html) => setFormData({ ...formData, content: html })}
          placeholder="Write your article content here..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value as ArticleCategory })
            }
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value as ArticleStatus })
            }
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tags (press Enter)"
          />
          <Button type="button" onClick={handleAddTag} variant="secondary">
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
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
                    onClick={() => handleRemoveAttachment(attachment.url)}
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

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : article
              ? "Update Article"
              : "Create Article"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
