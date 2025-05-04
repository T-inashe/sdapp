import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: './research-nexus/tsconfig.node.json',
        babelConfig: {
          presets: [
            '@babel/preset-react',
            '@babel/preset-env',
            '@babel/preset-typescript'
          ]
        }
      }
    ]
  },
  setupFilesAfterEnv: [
    '<rootDir>/research-nexus/src/setupTests.ts',
    '<rootDir>/research-nexus/src/setupJestEnv.ts'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/research-nexus/src/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: './research-nexus/tsconfig.node.json',
      diagnostics: {
        ignoreCodes: [1343]
      }
    }
  }
};

export default config;