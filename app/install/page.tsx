import { InstallationWizard } from "@/components/installation/installation-wizard";
import { checkInstallationStatus } from "@/lib/actions/installation";
import { redirect } from "next/navigation";

export default async function InstallPage() {
  const status = await checkInstallationStatus();

  // If already installed, redirect to login
  if (status.installed) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <InstallationWizard initialStep={status.step} />
    </div>
  );
}
