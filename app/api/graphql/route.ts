import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Get the session to access the user's access token
    const session = await getServerSession(authOptions);
    console.log('[GraphQL Proxy] Full session:', JSON.stringify(session, null, 2));
    console.log('[GraphQL Proxy] Session user:', session?.user?.email);
    console.log('[GraphQL Proxy] Access token:', session?.accessToken ? 'EXISTS' : 'MISSING');

    // Check if user is authenticated
    if (!session || !session.accessToken) {
      console.error('[GraphQL Proxy] No session or access token');
      return NextResponse.json(
        {
          errors: [
            {
              message: 'Authentication required',
              details: 'No valid session found',
            },
          ],
        },
        { status: 401 }
      );
    }

    // Get the GraphQL query from the request body
    const body = await request.json();
    console.log('[GraphQL Proxy] Request body:', JSON.stringify(body, null, 2));

    // Get the backend GraphQL URL
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql';
    console.log('[GraphQL Proxy] Backend URL:', graphqlUrl);

    // Forward the request to the backend GraphQL server
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add the authorization header with the user's access token
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
      body: JSON.stringify(body),
    });

    console.log('[GraphQL Proxy] Backend response status:', response.status);

    // Get the response text first
    const responseText = await response.text();
    console.log('[GraphQL Proxy] Backend response:', responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[GraphQL Proxy] Failed to parse response as JSON:', parseError);
      return NextResponse.json(
        {
          errors: [
            {
              message: 'Invalid JSON response from backend',
              details: responseText.substring(0, 200),
            },
          ],
        },
        { status: 500 }
      );
    }

    // Return the GraphQL response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[GraphQL Proxy] Error:', error);
    return NextResponse.json(
      {
        errors: [
          {
            message: error instanceof Error ? error.message : 'Internal server error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        ],
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight (not needed for same-origin, but good practice)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
