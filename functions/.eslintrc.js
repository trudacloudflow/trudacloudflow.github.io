module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "google",
    "plugin:@typescript-eslint/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
  }
};