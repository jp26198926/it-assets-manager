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
  Download,
  FileIcon,
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

  const canEdit = userRole === "admin" || userId === article.authorId;
  // Admin has full delete access, others can only delete their own articles
  const canDelete = userRole === "admin" || userId === article.authorId;

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
          <div
            className="tiptap prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.attachments && article.attachments.length > 0 && (
            <>
              <Separator className="my-8" />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileIcon className="h-5 w-5" />
                  Attachments
                </h3>
                <div className="space-y-2">
                  {article.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      download={attachment.name}
                      className="flex items-center justify-between p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileIcon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

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
                        {related.content
                          .replace(/<[^>]*>/g, "")
                          .substring(0, 100) + "..."}
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
