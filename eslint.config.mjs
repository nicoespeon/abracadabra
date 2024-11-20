import eslintjs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const OFF = 0;
const WARN = 1;
const ERROR = 2;

/**
 * @param {"error" | "warn"} reportErrorsAs
 */
export function createConfig(reportErrorsAs = "error") {
  const errorLevel = reportErrorsAs === "error" ? ERROR : WARN;

  return tseslint.config(
    eslintjs.configs.recommended,
    ...tseslint.configs.recommended,
    {
      ignores: [
        "**/node_modules/**",
        "**/out/**",
        "**/_templates/**",
        "**/playground/**"
      ],
      languageOptions: {
        ecmaVersion: 13,
        sourceType: "module",
        globals: {
          ...globals.node,
          ...globals.jest
        }
      },
      rules: {
        eqeqeq: [errorLevel, "smart"],
        radix: errorLevel,

        "@typescript-eslint/ban-ts-comment": OFF,
        "@typescript-eslint/ban-types": OFF,
        "@typescript-eslint/no-empty-function": OFF,
        "@typescript-eslint/no-explicit-any": OFF,
        "@typescript-eslint/no-unused-vars": OFF,
        "@typescript-eslint/no-unsafe-function-type": OFF,

        "block-scoped-var": errorLevel,
        "default-case-last": errorLevel,
        "default-case": errorLevel,
        "dot-notation": errorLevel,
        "func-name-matching": errorLevel,
        "guard-for-in": errorLevel,
        "max-lines": [errorLevel, { max: 1024 }],
        "max-nested-callbacks": errorLevel,
        "new-cap": errorLevel,
        "no-invalid-this": errorLevel,
        "no-unused-expressions": OFF,

        "consistent-this": OFF,
        "no-control-regex": OFF,
        "no-empty": OFF,
        "no-use-before-define": OFF
      }
    }
  );
}

export default createConfig("error");
