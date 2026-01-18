import { MainLayout } from "@/components/layout/main-layout";
import { getArticles } from "@/lib/actions/knowledge";
import { KnowledgebasePageContent } from "@/components/knowledgebase/knowledgebase-page-content";
import { getCurrentUser } from "@/lib/actions/auth";

export default async function KnowledgebasePage() {
  // Get current user from session (may be null for guests)
  const user = await getCurrentUser();
  const userRole = user?.role;
  const isGuest = !user;

  // Get articles - if user is admin/manager, show all statuses, otherwise only published
  const filters =
    userRole === "admin" || userRole === "manager"
      ? {}
      : { status: "published" as const };
  const result = await getArticles(filters);
  const articles = result.success && result.data ? result.data : [];

  // For guests, render without MainLayout (no sidebar)
  if (isGuest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6 lg:p-8">
          <KnowledgebasePageContent
            initialArticles={articles}
            userRole={userRole}
            isGuest={isGuest}
          />
        </div>
      </div>
    );
  }

  // For authenticated users, use MainLayout with sidebar
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <KnowledgebasePageContent
          initialArticles={articles}
          userRole={userRole}
          isGuest={isGuest}
        />
      </div>
    </MainLayout>
  );
}
