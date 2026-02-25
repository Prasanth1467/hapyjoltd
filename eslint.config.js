// https://docs.expo.dev/guides/using-eslint/
const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

const nodeGlobals = {
  __dirname: "readonly",
  __filename: "readonly",
  module: "readonly",
  require: "readonly",
  process: "readonly",
  exports: "readonly",
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "supabase/functions/**"],
  },
  {
    files: ["eslint.config.js", "scripts/**/*.js"],
    languageOptions: { globals: nodeGlobals },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    settings: {
      "import/resolver": {
        alias: {
          map: [["@", path.resolve(__dirname)]],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },
  },
]);
