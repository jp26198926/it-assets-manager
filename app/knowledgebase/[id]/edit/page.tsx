import { MainLayout } from "@/components/layout/main-layout";
import { getArticleById } from "@/lib/actions/knowledge";
import { ArticleForm } from "@/components/knowledgebase/article-form";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;
  const result = await getArticleById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  // Get current user from session
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check permissions
  const canEdit =
    user.role === "admin" ||
    user.role === "manager" ||
    user.id === result.data.authorId;

  if (!canEdit) {
    redirect(`/knowledgebase/${id}`);
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Article</h1>
          <p className="text-muted-foreground">
            Update your knowledge base article
          </p>
        </div>
        <ArticleForm
          article={result.data}
          authorId={user.id}
          authorName={user.name}
        />
      </div>
    </MainLayout>
  );
}
