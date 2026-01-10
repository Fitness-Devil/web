import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const runtime = 'nodejs';

const resolveBaseUrl = () => {
  if (process.env.REST_BACKEND_URL) {
    return process.env.REST_BACKEND_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (graphqlUrl) {
    return graphqlUrl.replace(/\/graphql\/?$/, '');
  }

  return 'http://localhost:8080';
};

async function proxyRequest(request: NextRequest) {
  let targetUrl = '';
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        {
          message: 'Authentication required',
          details: 'No valid session found',
        },
        { status: 401 }
      );
    }

    const path = request.nextUrl.pathname.replace(/^\/api\/rest\/?/, '');
    const baseUrl = resolveBaseUrl().replace(/\/+$/, '');
    const base = new URL(baseUrl);
    const basePath = base.pathname.replace(/\/+$/, '');
    const apiPath = basePath.endsWith('/api') ? basePath : `${basePath}/api`;
    const fullPath = path ? `${apiPath}/${path}` : apiPath;
    targetUrl = `${base.origin}${fullPath}${request.nextUrl.search}`;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${session.accessToken}`);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
    }

    const bodyText = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: bodyText && bodyText.length > 0 ? bodyText : undefined,
    });

    const responseText = await response.text();
    let json: any = null;

    if (responseText) {
      try {
        json = JSON.parse(responseText);
      } catch {
        json = responseText;
      }
    }

    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        },
      });
    }

    if (typeof json === 'string') {
      return new NextResponse(json, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        },
      });
    }

    return NextResponse.json(json, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('REST proxy failed', {
      targetUrl,
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error && 'cause' in error ? (error as Error & { cause?: unknown }).cause : undefined,
    });
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Internal server error',
        targetUrl,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}
