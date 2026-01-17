import { MainLayout } from "@/components/layout/main-layout";
import { ArticleForm } from "@/components/knowledgebase/article-form";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";

export default async function NewArticlePage() {
  // Get current user from session
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check permissions - only admin and manager can create articles
  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/knowledgebase");
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create New Article</h1>
          <p className="text-muted-foreground">
            Add a new article to the knowledge base
          </p>
        </div>
        <ArticleForm authorId={user.id} authorName={user.name} />
      </div>
    </MainLayout>
  );
}
