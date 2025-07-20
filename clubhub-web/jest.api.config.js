module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.api.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.api.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    '!src/app/api/**/*.d.ts',
  ],
  coverageDirectory: 'coverage/api',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}; 