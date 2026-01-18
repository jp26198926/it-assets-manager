import { MainLayout } from "@/components/layout/main-layout";
import { getArticleById } from "@/lib/actions/knowledge";
import { ArticleViewer } from "@/components/knowledgebase/article-viewer";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const result = await getArticleById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  // Get current user from session
  const user = await getCurrentUser();
  const userRole = user?.role;
  const userId = user?.id;
  const isGuest = !user;

  // For guests, render without MainLayout (no sidebar)
  if (isGuest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6 lg:p-8">
          <ArticleViewer
            article={result.data}
            userRole={userRole}
            userId={userId}
          />
        </div>
      </div>
    );
  }

  // For authenticated users, use MainLayout with sidebar
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <ArticleViewer
          article={result.data}
          userRole={userRole}
          userId={userId}
        />
      </div>
    </MainLayout>
  );
}
