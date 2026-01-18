import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { GuestLandingPage } from "@/components/guest/guest-landing-page";

export default async function HomePage() {
  const user = await getCurrentUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Show public landing page for guests
  return <GuestLandingPage />;
}
