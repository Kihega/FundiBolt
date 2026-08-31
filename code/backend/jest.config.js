/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],
};
