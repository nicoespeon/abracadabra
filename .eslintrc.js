const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["node_modules", "out", "_templates", "src/playground"],
  rules: {
    eqeqeq: [ERROR, "smart"],
    radix: ERROR,

    "@typescript-eslint/ban-ts-comment": OFF,
    "@typescript-eslint/ban-types": OFF,
    "@typescript-eslint/no-empty-function": OFF,
    "@typescript-eslint/no-explicit-any": OFF,
    "@typescript-eslint/no-unused-vars": OFF,

    "block-scoped-var": ERROR,
    "default-case-last": ERROR,
    "default-case": ERROR,
    "dot-notation": ERROR,
    "func-name-matching": ERROR,
    "guard-for-in": ERROR,
    "max-lines": [ERROR, { max: 1024 }],
    "max-nested-callbacks": ERROR,
    "new-cap": ERROR,
    "no-invalid-this": ERROR,
    "no-unused-expressions": OFF,

    "consistent-this": OFF,
    "no-control-regex": OFF,
    "no-empty": OFF,
    "no-use-before-define": OFF
  }
};
