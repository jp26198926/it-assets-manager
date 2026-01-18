import { checkInstallationStatus } from "@/lib/actions/installation";
import { NextResponse } from "next/server";

export async function GET() {
  const status = await checkInstallationStatus();
  return NextResponse.json(status);
}
