import { NextResponse } from "next/server";
import { getSettings } from "@/lib/actions/settings";

export async function GET() {
  try {
    const result = await getSettings();

    if (result.success && result.data) {
      return NextResponse.json({
        themeColor: result.data.themeColor,
      });
    }

    return NextResponse.json({
      themeColor: "blue",
    });
  } catch (error) {
    return NextResponse.json(
      {
        themeColor: "blue",
      },
      { status: 500 },
    );
  }
}
