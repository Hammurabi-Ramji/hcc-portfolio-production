const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_ENV_PATHS = [
  path.join(PROJECT_ROOT, '.env'),
  path.join(PROJECT_ROOT, '.env.example')
];

const OPTIONAL_WARNING_KEYS = [
  'OPENCLAW_API_KEY',
  'PROXY_URL',
  'NOTIFICATION_EMAIL',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'WEBHOOK_URL',
  'WEBHOOK_SECRET'
];

const COMMAND_RULES = {
  default: { required: [], optionalWarnings: OPTIONAL_WARNING_KEYS },
  health: { required: [], optionalWarnings: OPTIONAL_WARNING_KEYS },
  scrape: { required: [], optionalWarnings: OPTIONAL_WARNING_KEYS },
  test: { required: [], optionalWarnings: OPTIONAL_WARNING_KEYS },
  status: { required: [], optionalWarnings: OPTIONAL_WARNING_KEYS },
  logs: { required: [], optionalWarnings: [] },
  help: { required: [], optionalWarnings: [] },
  fda: { required: ['HCC_FDA_API_URL', 'HCC_FDA_TOKEN'], optionalWarnings: OPTIONAL_WARNING_KEYS },
  mantle: { required: ['HCC_MANTLE_API_URL'], optionalWarnings: [...OPTIONAL_WARNING_KEYS, 'HCC_MANTLE_TOKEN'] },
  pharma: { required: ['HCC_PHARMA_API_URL', 'HCC_PHARMA_TOKEN'], optionalWarnings: OPTIONAL_WARNING_KEYS },
  schedule: {
    required: [
      'HCC_FDA_API_URL',
      'HCC_FDA_TOKEN',
      'HCC_MANTLE_API_URL',
      'HCC_MANTLE_TOKEN',
      'HCC_PHARMA_API_URL',
      'HCC_PHARMA_TOKEN'
    ],
    optionalWarnings: OPTIONAL_WARNING_KEYS
  }
};

let loadedEnvPath;

function loadEnv() {
  if (loadedEnvPath !== undefined) {
    return loadedEnvPath;
  }

  for (const envPath of DEFAULT_ENV_PATHS) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      loadedEnvPath = envPath;
      return loadedEnvPath;
    }
  }

  loadedEnvPath = null;
  return loadedEnvPath;
}

function readEnv(env, key) {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isPlaceholderValue(value) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  const placeholderPatterns = [
    /^your[_-]/,
    /^your\s/,
    /^secure_password$/,
    /^admin@example\.com$/,
    /^your-email@gmail\.com$/,
    /^your-app-password$/,
    /^your-secret-key$/,
    /^https?:\/\/your-api\.com\//,
    /^http:\/\/proxy\.example\.com:\d+$/,
    /placeholder/,
    /example\.com/,
    /example\.org/,
    /changeme/,
    /replace[-_ ]?me/
  ];

  return placeholderPatterns.some((pattern) => pattern.test(normalized));
}

function isUrlKey(key) {
  return key.endsWith('_URL') || key.includes('API_URL');
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch (error) {
    return false;
  }
}

function validateRuntimeConfig({ command = 'default', env = process.env } = {}) {
  const rules = COMMAND_RULES[command] || COMMAND_RULES.default;
  const errors = [];
  const warnings = [];

  for (const key of rules.required) {
    const value = readEnv(env, key);

    if (!value) {
      errors.push(`${key} is required for "${command}" but is missing.`);
      continue;
    }

    if (isPlaceholderValue(value)) {
      errors.push(`${key} is still using a placeholder/example value for "${command}".`);
      continue;
    }

    if (isUrlKey(key) && !isValidUrl(value)) {
      errors.push(`${key} must be a valid URL for "${command}".`);
    }
  }

  for (const key of rules.optionalWarnings) {
    const value = readEnv(env, key);

    if (value && isPlaceholderValue(value)) {
      warnings.push(`${key} is still set to an example/placeholder value and will be ignored until configured.`);
    }
  }

  return {
    command,
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function initializeRuntimeConfig(options = {}) {
  const envPath = loadEnv();
  const result = validateRuntimeConfig({ ...options, env: process.env });

  return {
    ...result,
    envPath
  };
}

function printValidationReport(result) {
  if (result.envPath) {
    console.log(`⚙️  Runtime config loaded from: ${path.basename(result.envPath)}`);
  } else {
    console.warn('⚠️  No .env or .env.example file was found.');
  }

  for (const warning of result.warnings) {
    console.warn(`⚠️  ${warning}`);
  }

  for (const error of result.errors) {
    console.error(`❌ ${error}`);
  }
}

module.exports = {
  loadEnv,
  validateRuntimeConfig,
  initializeRuntimeConfig,
  printValidationReport,
  isPlaceholderValue
};
