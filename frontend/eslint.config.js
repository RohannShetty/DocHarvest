import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

/**
 * The desktop GUI had no linter at all until now - the website has had one for
 * a while, so a bug could sit in the app surface indefinitely. Flat config,
 * ESLint 10, typescript-eslint.
 */
export default tseslint.config(
  { ignores: ["dist", "src/docharvest/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      /* Debt this linter surfaced the moment it was switched on, kept visible
         as warnings rather than silenced:
           - no-explicit-any: 53 pre-existing annotations across the views
           - set-state-in-effect: 7 effects that set state synchronously and can
             cascade a render; each needs an effect refactor, not a suppression
           - exhaustive-deps: 4 dependency arrays to review for correctness
         Errors must stay at zero: `npm run lint` is expected to pass. */
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
)
