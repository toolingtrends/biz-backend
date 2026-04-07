/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__mocks__/**",
  ],
  coverageDirectory: "<rootDir>/coverage",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  /**
   * Type-checking is enforced by `pnpm build` (`tsc`). In a pnpm monorepo the
   * hoisted `@prisma/client` may reflect another workspace’s schema, so ts-jest
   * diagnostics here can false-negative. See: prisma multi-project / custom output.
   */
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
};
