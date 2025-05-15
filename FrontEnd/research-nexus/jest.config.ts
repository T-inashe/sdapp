import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'babel-jest',  // Use babel-jest to apply transformations
      {
        configFile: './babel.config.js',  // Ensure it uses your custom babel config (which includes the plugin for import.meta)
      },
    ],
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/setupJestEnv.ts',
    '<rootDir>/src/jest.setup.js',  // Ensure this is where you're mocking process.env
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.node.json',
      diagnostics: {
        ignoreCodes: [1343],
      },
    },
  },
};

export default config;
