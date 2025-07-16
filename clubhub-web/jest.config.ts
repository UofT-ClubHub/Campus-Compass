import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Handles `@/` path aliases from tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Look for test files
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test|spec).[jt]s?(x)'],

  // Run setup files before each test (optional, for things like RTL config)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Optional: ignore build output and node_modules
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

  // Optional: transform handling
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
};

export default config;