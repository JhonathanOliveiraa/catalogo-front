// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/** AD-1: só o facade (e core/config, que define o rootUrl) importa o cliente gerado. */
const importApiRestrito = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          regex: '(^|/)api(/|$)',
          message: 'Só produtos/produtos.service.ts importa de src/app/api (AD-1). Use os tipos reexportados pelo facade.',
        },
      ],
    },
  ],
};

module.exports = defineConfig([
  { ignores: ['src/app/api/**', 'dist/**', '.angular/**'] },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      ...importApiRestrito,
    },
  },
  {
    files: ['src/app/produtos/produtos.service.ts', 'src/app/core/config/**/*.ts', '**/*.spec.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
