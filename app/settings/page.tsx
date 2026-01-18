import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getSettings } from "@/lib/actions/settings";
import { MainLayout } from "@/components/layout/main-layout";
import { CompanyDetailsForm } from "@/components/settings/company-details-form";
import { ThemeSettingsForm } from "@/components/settings/theme-settings-form";
import { EmailConfigForm } from "@/components/settings/email-config-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only admins can access settings
  if (user.role !== "admin") {
    redirect("/");
  }

  const settingsResult = await getSettings();

  if (!settingsResult.success || !settingsResult.data) {
    redirect("/");
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">App Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application configuration and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <CompanyDetailsForm
              settings={settingsResult.data}
              currentUser={user}
            />
            <ThemeSettingsForm
              settings={settingsResult.data}
              currentUser={user}
            />
          </div>
          <div>
            <EmailConfigForm
              settings={settingsResult.data}
              currentUser={user}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
