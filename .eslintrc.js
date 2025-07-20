module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended"],
  rules: {
    // Only the most critical rules
    "no-unused-vars": "off", // Turn off base rule
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off", // Allow console in tests and setup
    "prefer-const": "warn",
    "no-var": "warn",
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js"],
};
