import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import parserVue from 'vue-eslint-parser'
import tseslint from '@typescript-eslint/eslint-plugin'
import parserTypeScript from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  // Files to ignore
  {
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**'],
  },

  // Base JavaScript config
  js.configs.recommended,

  // Vue.js config
  ...pluginVue.configs['flat/recommended'],

  // Global configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Override base rules to make unused variables warnings
      // 'no-unused-vars': 'off', // Turn off base rule
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],

      // Relax Vue.js rules
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      'vue/html-indent': 'off',
      'vue/no-template-shadow': 'off',
      'vue/no-mutating-props': 'off',

      // Other relaxed rules
      'no-useless-escape': 'off',
    },
  },

  // Vue files configuration
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: parserTypeScript,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
  },

  // TypeScript files configuration
  {
    files: ['**/*.{ts,mts,tsx}'],
    languageOptions: {
      parser: parserTypeScript,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Turn off base unused vars rule for TypeScript files
      // 'no-unused-vars': 'off',

      // Use TypeScript-specific unused vars rule as warning
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
] 