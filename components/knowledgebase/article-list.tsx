"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KnowledgeArticleSerialized } from "@/lib/actions/knowledge";
import { Eye, ThumbsUp, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

interface ArticleListProps {
  articles: KnowledgeArticleSerialized[];
}

export function ArticleList({ articles }: ArticleListProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Helpful</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article._id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/knowledgebase/${article._id}`}
                      className="block hover:underline"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-medium line-clamp-1">
                          {article.title}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {article.summary ||
                            article.content.substring(0, 100) + "..."}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {article.category}
                    </Badge>
                    {article.status !== "published" && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {article.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{article.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {article.authorName}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{article.viewCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{article.helpfulCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(article.updatedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {articles.map((article) => (
          <Link key={article._id} href={`/knowledgebase/${article._id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline">{article.category}</Badge>
                  {article.status !== "published" && (
                    <Badge variant="secondary">{article.status}</Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2">{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {article.summary || article.content.substring(0, 150) + "..."}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {article.helpfulCount}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(article.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  By {article.authorName}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
