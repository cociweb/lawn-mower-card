// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { fileURLToPath } from "url";

// Resolve the directory for FlatCompat
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // 1) bring in your old "extends" shareable configs
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ),

  // 2) re-declare parser, parserOptions, env, plugins, and any custom rules
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      },
      env: {
        browser: true,
        es6: true
      }
    },
    plugins: {
      import: importPlugin,
      "@typescript-eslint": tsPlugin
    },
    rules: {
      // add your custom rules here, for example:
      // "import/no-unresolved": "error",
      // "@typescript-eslint/explicit-function-return-type": "off"
    }
  }
];
