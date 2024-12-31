import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"] },
  { ignores: ["node_modules/*", "dist/*", ".tmp"] },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  pluginJs.configs.recommended,
  sonarjs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow explicit any
      "@typescript-eslint/no-explicit-any": "off",
      // Disallow unused vars except for `v`
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^v$"
        }
      ],
      "sonarjs/no-nested-functions": [
        "error",
        {
          allow: ["^describe", "^it"]
        }
      ]
    }
  }
];
