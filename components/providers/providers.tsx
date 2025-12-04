'use client';

import { SessionProvider } from 'next-auth/react';
import { ApolloProviderWrapper } from './apollo-provider';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ApolloProviderWrapper>
        {children}
      </ApolloProviderWrapper>
    </SessionProvider>
  );
}
