import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get all query parameters from the client request
  const query = searchParams.get("q");
  const limit = searchParams.get("limit") || "10";
  const offset = searchParams.get("offset") || "0";
  const sort = searchParams.get("sort");
  const fields =
    searchParams.get("fields") ||
    "key,title,author_name,first_publish_year,cover_i,subject";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Build the OpenLibrary URL
    const openLibraryUrl = new URL("https://openlibrary.org/search.json");
    openLibraryUrl.searchParams.append("q", query);
    openLibraryUrl.searchParams.append("limit", limit);
    openLibraryUrl.searchParams.append("offset", offset);
    // Don't add sort - it might cause 500 errors
    openLibraryUrl.searchParams.append("fields", fields);

    console.log(
      `📚 Proxying OpenLibrary request: ${openLibraryUrl.toString()}`
    );

    // Make the request to OpenLibrary from our server (no CORS issues)
    const response = await fetch(openLibraryUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "BookHaven/1.0 (contact@bookhaven.com)", // Good practice to identify your app
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenLibrary API error details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: openLibraryUrl.toString(),
      });
      throw new Error(
        `OpenLibrary API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`📚 OpenLibrary success: ${data.numFound || 0} books found`);

    // Add CORS headers to allow our frontend to access this
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("OpenLibrary proxy error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch from OpenLibrary",
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
