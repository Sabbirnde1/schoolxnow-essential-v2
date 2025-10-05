// Configuration validation utility
// This file provides helper functions for validating and debugging configuration
import SecureConfig from './secure-config';

/**
 * Checks all environment variables and returns a validation report
 * @security All credential values are masked/redacted in the report
 */
export function validateEnvironmentVariables(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: Record<string, string>;
} {
  // Use secure validation - returns only safe-to-log information
  const validation = SecureConfig.validate();

  return {
    valid: validation.isValid,
    errors: validation.errors,
    warnings: [], // SecureConfig doesn't differentiate warnings currently
    info: validation.safeInfo,
  };
}

/**
 * Prints a formatted configuration report to console
 * @security All sensitive values are automatically masked
 */
export function printConfigurationReport(): void {
  const report = validateEnvironmentVariables();

  console.group('� Secure Configuration Report');

  if (report.valid) {
    console.log('✅ Configuration is valid');
  } else {
    console.error('❌ Configuration has errors');
  }

  if (report.errors.length > 0) {
    console.group('❌ Errors');
    report.errors.forEach((error) => console.error(`  • ${error}`));
    console.groupEnd();
  }

  if (report.warnings.length > 0) {
    console.group('⚠️  Warnings');
    report.warnings.forEach((warning) => console.warn(`  • ${warning}`));
    console.groupEnd();
  }

  if (Object.keys(report.info).length > 0) {
    console.group('ℹ️  Safe Information (Credentials Masked)');
    Object.entries(report.info).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.groupEnd();
  }

  console.groupEnd();

  if (!report.valid) {
    console.log('\n📖 Setup: ENV_SETUP.md');
    console.log('💡 Quick fix: Copy .env.example to .env and fill in your values');
    console.log('🔐 Security: Credentials are never exposed in logs');
  }
}

/**
 * Diagnostic function to help troubleshoot configuration issues
 * @security No sensitive values are ever logged
 */
export function diagnoseConfiguration(): void {
  console.group('🔍 Secure Configuration Diagnostics');

  // Check if .env file is likely loaded
  const allEnvVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
  console.log(`Found ${allEnvVars.length} VITE_ environment variables`);
  
  if (allEnvVars.length === 0) {
    console.error('⚠️  No VITE_ variables found!');
    console.error('This usually means:');
    console.error('  1. No .env file exists in the project root');
    console.error('  2. The .env file is not formatted correctly');
    console.error('  3. The dev server needs to be restarted');
  } else {
    // Only show variable names, not values
    console.log('Available VITE_ variables:', allEnvVars);
  }

  // Check Supabase-specific variables (existence only)
  const hasUrl = SecureConfig.isConfigured() && !!SecureConfig.getUrl();
  const hasKey = SecureConfig.isConfigured() && !!SecureConfig.getKey();

  console.log('\n🔐 Supabase Configuration Status:');
  console.log(`  VITE_SUPABASE_URL: ${hasUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  VITE_SUPABASE_ANON_KEY: ${hasKey ? '✅ Set' : '❌ Missing'}`);

  if (hasUrl) {
    console.log(`  Safe URL: ${SecureConfig.getSafeUrl()}`);
  }
  if (hasKey) {
    console.log(`  Safe Key: ${SecureConfig.getSafeKey()}`);
  }

  // Print full validation report (already secured)
  console.log('\n📋 Full Validation Report:');
  printConfigurationReport();

  console.log('\n🔒 Security Note: All credential values are masked in logs');

  console.groupEnd();
}

// Auto-run diagnostics in development mode if there are issues
if (import.meta.env.DEV) {
  const report = validateEnvironmentVariables();
  if (!report.valid) {
    console.error('\n⚠️  Configuration issues detected!');
    diagnoseConfiguration();
  }
}
