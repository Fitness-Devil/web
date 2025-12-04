import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Function to create Apollo Client (called on client-side only)
export function createApolloClient() {
  // Use Next.js API route as proxy to avoid CORS issues
  const httpLink = new HttpLink({
    uri: '/api/graphql',
    credentials: 'same-origin', // Include cookies for session
  });

  // Auth link - no longer needed since API route handles auth
  const authLink = setContext(async (_, { headers }) => {
    return {
      headers: {
        ...headers,
      },
    };
  });

  // Error link for handling GraphQL errors
  const errorLink = onError((error: any) => {
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach((err: any) => {
        console.error(
          `[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`
        );
      });
    }

    if (error.networkError) {
      console.error(`[Network error]: ${error.networkError}`);
    }
  });

  // Combine all links
  const link = from([errorLink, authLink, httpLink]);

  // Create Apollo Client
  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}
