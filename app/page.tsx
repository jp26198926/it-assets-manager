import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { GuestLandingPage } from "@/components/guest/guest-landing-page";
import { checkInstallationStatus } from "@/lib/actions/installation";

export default async function HomePage() {
  // Check if system needs installation
  try {
    const status = await checkInstallationStatus();
    if (!status.installed) {
      redirect("/install");
    }
  } catch (error) {
    // If error checking installation, redirect to install
    redirect("/install");
  }

  const user = await getCurrentUser();

  console.log("Logged User", user);

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Show public landing page for guests
  return <GuestLandingPage />;
}
