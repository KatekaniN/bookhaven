import { NextRequest, NextResponse } from "next/server";

// In-memory cache for NY Times data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours for faster updates

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listName = searchParams.get("list") || "hardcover-fiction";

  // Check cache first
  const cacheKey = `nyt-${listName}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`📰 Cache hit for NY Times list: ${listName}`);
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=21600", // 6 hours
      },
    });
  }

  // Get API key from environment
  const apiKey = process.env.NYT || process.env.NEXT_PUBLIC_NYT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "NY Times API key not configured" },
      { status: 500 }
    );
  }

  try {
    console.log(`📰 Fetching NY Times list: ${listName}`);

    const response = await fetch(
      `https://api.nytimes.com/svc/books/v3/lists/current/${listName}.json?api-key=${apiKey}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "BookHaven/1.0 (contact@bookhaven.app)",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NY Times API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `NY Times API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(
      `📰 NY Times success: ${data.results?.books?.length || 0} books found`
    );

    // Cache the response
    cache.set(cacheKey, { data, timestamp: now });

    // Clean up old cache entries
    cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    });

    // Add CORS headers and cache control
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=21600", // 6 hours
      },
    });
  } catch (error) {
    console.error("NY Times proxy error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch from NY Times",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
