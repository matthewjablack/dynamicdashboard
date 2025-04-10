import { NextResponse } from "next/server";
import { getUserTweets } from "@/lib/twitter";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get("username");
    const limit = parseInt(searchParams.get("limit") || "10");
    const hours = searchParams.get("hours") ? parseInt(searchParams.get("hours")!) : undefined;

    if (!usernameParam) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Split usernames by comma and trim whitespace
    const usernames = usernameParam.split(",").map((u) => u.trim());

    const tweets = await getUserTweets(usernames, limit, hours);
    return NextResponse.json(tweets);
  } catch (error: any) {
    console.error("Error in /api/twitter/user-tweets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tweets" },
      { status: error.response?.status || 500 }
    );
  }
}
