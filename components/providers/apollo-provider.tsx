'use client';

import { ApolloProvider } from '@apollo/client/react';
import { createApolloClient } from '@/lib/apollo-client';
import { ReactNode, useMemo } from 'react';

interface ApolloProviderWrapperProps {
  children: ReactNode;
}

export function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  // Create Apollo Client once on the client side
  const client = useMemo(() => createApolloClient(), []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
