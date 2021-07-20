module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["./src/test/custom-matchers.ts"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/out/", ".contract.test.ts"],
  globals: {
    "ts-jest": {
      // With TS 3.9+ it is recommended to make TS config explicit
      // Without it, tests fail for type errors that don't exist at compilation
      tsconfig: "tsconfig.json"
    }
  }
};
