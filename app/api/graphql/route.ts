import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT;

    if (!graphqlEndpoint) {
      return NextResponse.json(
        { error: "GraphQL endpoint not configured" },
        { status: 500 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Forward the request to the actual GraphQL endpoint
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json();

    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying GraphQL request:", error);
    return NextResponse.json(
      { error: "Failed to proxy GraphQL request" },
      { status: 500 }
    );
  }
}
