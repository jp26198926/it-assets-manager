"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  ArrowLeft,
} from "lucide-react";
import type { KnowledgeArticleSerialized } from "@/lib/actions/knowledge";
import {
  incrementViewCount,
  markArticleHelpful,
  deleteArticle,
  getRelatedArticles,
} from "@/lib/actions/knowledge";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ArticleViewerProps {
  article: KnowledgeArticleSerialized;
  userRole?: string;
  userId?: string;
}

export function ArticleViewer({
  article,
  userRole,
  userId,
}: ArticleViewerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [relatedArticles, setRelatedArticles] = useState<
    KnowledgeArticleSerialized[]
  >([]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    // Increment view count when article is viewed
    incrementViewCount(article._id);

    // Load related articles
    loadRelatedArticles();
  }, [article._id]);

  const loadRelatedArticles = async () => {
    const result = await getRelatedArticles(article._id, 3);
    if (result.success && result.data) {
      setRelatedArticles(result.data);
    }
  };

  const handleVote = async (helpful: boolean) => {
    if (hasVoted) {
      toast({
        title: "Already voted",
        description: "You have already voted on this article",
        variant: "destructive",
      });
      return;
    }

    const result = await markArticleHelpful(article._id, helpful);
    if (result.success) {
      setHasVoted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded",
      });
    }
  };

  const handleDelete = async () => {
    const result = await deleteArticle(article._id);
    if (result.success) {
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
      router.push("/knowledgebase");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  const canEdit =
    userRole === "admin" ||
    userRole === "manager" ||
    userId === article.authorId;
  // Admin has full delete access, others can only delete their own articles
  const canDelete = userRole === "admin" || userId === article.authorId;

  // Simple markdown-like rendering (basic version)
  const renderContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
            {line.substring(4)}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-semibold mt-4 mb-2">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-4 mb-2">
            {line.substring(2)}
          </h1>
        );
      }

      // Lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={index} className="ml-4">
            {line.substring(2)}
          </li>
        );
      }

      // Empty lines
      if (line.trim() === "") {
        return <br key={index} />;
      }

      // Regular paragraphs
      return (
        <p key={index} className="mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {canEdit && (
          <Link href={`/knowledgebase/${article._id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  article.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-2">
              <Badge variant="outline">{article.category}</Badge>
              {article.status !== "published" && (
                <Badge variant="secondary">{article.status}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {article.helpfulCount}
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

          {article.summary && (
            <p className="text-lg text-muted-foreground mb-4">
              {article.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {article.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(article.createdAt), "PPP")}
            </span>
            <span className="text-xs">
              Updated {formatDistanceToNow(new Date(article.updatedAt))} ago
            </span>
          </div>

          {article.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Separator className="mb-6" />
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {renderContent(article.content)}
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium">Was this article helpful?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleVote(true)}
                disabled={hasVoted}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes ({article.helpfulCount})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleVote(false)}
                disabled={hasVoted}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                No ({article.notHelpfulCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {relatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Related Articles</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedArticles.map((related) => (
                <Link
                  key={related._id}
                  href={`/knowledgebase/${related._id}`}
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{related.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {related.summary ||
                          related.content.substring(0, 100) + "..."}
                      </p>
                    </div>
                    <Badge variant="outline">{related.category}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
