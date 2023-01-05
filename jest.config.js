module.exports = {
  setupFilesAfterEnv: ["./src/test/custom-matchers.ts"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/out/", ".contract.test.ts"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
    "\\.(html)$": "html-loader-jest"
  }
};
