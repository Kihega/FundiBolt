module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react-hooks"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
  env: {
    es2020: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ["node_modules", ".expo", "dist", "web-build"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "off",
    // require("../assets/...") is the standard, correct way to
    // reference static images/fonts in Expo/React Native - Metro
    // needs it statically analyzable, so this isn't a bug to rewrite
    // as an import.
    "@typescript-eslint/no-require-imports": "off",
  },
};
