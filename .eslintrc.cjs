module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@nuxtjs'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: [],
  rules: {
    // 基本的代码风格
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-const': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
