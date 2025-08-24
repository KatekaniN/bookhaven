import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      session,
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      hasImage: !!session?.user?.image,
      imageUrl: session?.user?.image,
    });
  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
