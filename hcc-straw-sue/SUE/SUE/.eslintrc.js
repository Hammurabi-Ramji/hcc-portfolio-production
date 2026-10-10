module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    webextensions: true,
    worker: true,
  },
  globals: {
    EyeDropper: 'readonly',
    GPUBufferUsage: 'readonly',
    TextDetector: 'readonly',
    importScripts: 'readonly',
    startKeepalive: 'readonly',
    setupAlarmListener: 'readonly',
    scheduleTask: 'readonly',
  },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist/', 'node_modules/', 'target/', 'pkg/', '*.min.js', '*.bundle.js'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [
    {
      files: [
        'background.js',
        'content.js',
        'keepalive-manager.js',
        'offline-handler.js',
        'offscreen-manager.js',
        'offscreen-worker.js',
        'popover-manager.js',
        'storage-manager.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      files: ['check.js', 'webpack.config.js'],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      files: ['*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-async-promise-executor': 'warn',
    'no-constant-condition': ['warn', { checkLoops: false }],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-script-url': 'error',
    'no-eval': 'warn',
    'no-implied-eval': 'error',
    'prefer-const': 'warn',
    'prefer-spread': 'warn',
    'prefer-rest-params': 'warn',
    'no-var': 'warn',
    'no-warning-comments': 'off',
  },
};
