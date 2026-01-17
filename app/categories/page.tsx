import { MainLayout } from "@/components/layout/main-layout";
import { getCategories } from "@/lib/actions/categories";
import { CategoriesPageContent } from "@/components/categories/categories-page-content";

export default async function CategoriesPage() {
  const result = await getCategories();
  const categories = result.success && result.data ? result.data : [];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <CategoriesPageContent initialCategories={categories} />
      </div>
    </MainLayout>
  );
}
