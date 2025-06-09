// .eslintrc.js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueEslintParser from 'vue-eslint-parser'
import tsEslintPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  // Global ignores - must be first
  {
    ignores: [
      'dist/**/*',
      'build/**/*',
      'node_modules/**/*',
      '.git/**/*',
      'coverage/**/*',
      '*.min.js',
      '*.bundle.js'
    ]
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // Vue 3 recommended rules
  ...pluginVue.configs['flat/recommended'],

  {
    files: ['src/**/*.{vue,ts}'], // Only apply TypeScript rules to source files
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2021,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
        project: './tsconfig.eslint.json'  // Dedicated ESLint TypeScript config
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        // ES2021 globals
        globalThis: 'readonly'
      }
    },
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': tsEslintPlugin
    },
    rules: {
      // Turn off forcing multi-word component names if you prefer single-word names
      'vue/multi-word-component-names': 'off',

      // Warn on unused vars instead of error
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',

      // Allow optional chaining without errors
      'vue/no-deprecated-v-on-native-modifier': 'off',

      // Allow undefined globals (for browser APIs)
      'no-undef': 'off',

      // TypeScript strict mode rules (gradual enforcement)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for Vue components
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for Vue components
      
      // Enable more TypeScript safety rules
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      // Vue specific improvements
      'vue/no-template-shadow': 'warn',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/no-unused-refs': 'warn',
      'vue/no-useless-v-bind': 'warn',
      'vue/prefer-true-attribute-shorthand': 'warn'
    }
  },

  {
    // Vue-specific overrides
    files: ['**/*.vue'],
    rules: {
      // Suppress some warnings in <template> or <script setup> if needed
      'vue/require-default-prop': 'off'
    }
  },

  {
    // JavaScript config files (no TypeScript checking)
    files: ['**/*.{js,mjs,cjs}', '*.config.{js,ts}', '*.config.*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        globalThis: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off'
    }
  }
]
