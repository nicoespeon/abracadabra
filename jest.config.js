module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/integration-tests/", "/out/"],
  globals: {
    "ts-jest": {
      // With TS 3.9+ it is recommended to make TS config explicit
      // Without it, tests fail for type errors that don't exist at compilation
      tsConfig: "tsconfig.json"
    }
  }
};
