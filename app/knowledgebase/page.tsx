import { MainLayout } from "@/components/layout/main-layout";
import { getArticles } from "@/lib/actions/knowledge";
import { KnowledgebasePageContent } from "@/components/knowledgebase/knowledgebase-page-content";
import { getCurrentUser } from "@/lib/actions/auth";

export default async function KnowledgebasePage() {
  // Get current user from session
  const user = await getCurrentUser();
  const userRole = user?.role;

  // Get articles - if user is admin/manager, show all statuses, otherwise only published
  const filters =
    userRole === "admin" || userRole === "manager"
      ? {}
      : { status: "published" as const };
  const result = await getArticles(filters);
  const articles = result.success && result.data ? result.data : [];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <KnowledgebasePageContent
          initialArticles={articles}
          userRole={userRole}
        />
      </div>
    </MainLayout>
  );
}
