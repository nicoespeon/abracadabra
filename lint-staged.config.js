module.exports = {
  "src/**/*.ts":
    "eslint -c eslint.config.precommit.mjs --fix --ignore-pattern '**/playground/**'",
  "*.{ts,json,md}": "prettier --write"
};
