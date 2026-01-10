type QueryValue = string | number | boolean | null | undefined;

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  query?: Record<string, QueryValue>;
};

const buildQueryString = (query?: Record<string, QueryValue>) => {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { query, body, headers, ...init } = options;
  const queryString = buildQueryString(query);
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/rest${path}${queryString}`, {
    ...init,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const hasBody = text.length > 0;
  let data: any = null;

  if (hasBody) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      response.statusText ||
      'Request failed';
    throw new Error(message);
  }

  return data as T;
}
