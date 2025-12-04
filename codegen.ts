import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql',
  documents: ['graphql/**/*.graphql', 'app/**/*.tsx', 'components/**/*.tsx'],
  generates: {
    'graphql/generated/': {
      preset: 'client',
      plugins: [],
    },
    'graphql/generated/graphql.tsx': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
      },
    },
  },
};

export default config;
