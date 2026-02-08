// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "warn",
        {
          type: "attribute",
          prefix: "lib",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "warn",
        {
          type: "element",
          prefix: "lib",
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/no-inferrable-types": [
        "warn",
      ],
      "@angular-eslint/prefer-inject": [
        "warn",
      ],
      "@typescript-eslint/no-explicit-any": [
        "warn",
      ],
      "@angular-eslint/no-output-on-prefix": [
        "warn",
      ]
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/prefer-control-flow": [
        "warn",
      ],
    },
  }
]);
