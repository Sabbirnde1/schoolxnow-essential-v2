/**
 * Secure Configuration Manager
 * 
 * This module provides secure access to sensitive configuration values
 * with automatic redaction in logs and error messages.
 */

// Internal storage for credentials (not directly accessible)
const _credentials = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

/**
 * Redacts a string by showing only the first and last few characters
 * @param value The string to redact
 * @param visibleChars Number of characters to show at start/end
 * @returns Redacted string
 */
export function redactString(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '[REDACTED]';
  }
  
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const middle = '*'.repeat(Math.min(8, value.length - visibleChars * 2));
  
  return `${start}${middle}${end}`;
}

/**
 * Masks a URL by redacting the subdomain while keeping the domain visible
 * @param url The URL to mask
 * @returns Masked URL
 */
export function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostParts = urlObj.hostname.split('.');
    
    if (hostParts.length > 2) {
      // Redact the project ID (subdomain)
      hostParts[0] = hostParts[0].substring(0, 4) + '***';
    }
    
    return `${urlObj.protocol}//${hostParts.join('.')}`;
  } catch {
    return '[INVALID_URL]';
  }
}

/**
 * Secure configuration accessor
 */
export class SecureConfig {
  /**
   * Gets the Supabase URL (actual value for use)
   * IMPORTANT: Only use this for actual API calls, never log this value
   */
  static getUrl(): string {
    return _credentials.url;
  }

  /**
   * Gets the Supabase API key (actual value for use)
   * IMPORTANT: Only use this for actual API calls, never log this value
   */
  static getKey(): string {
    return _credentials.key;
  }

  /**
   * Gets a masked/safe version of the URL for logging
   * @returns Masked URL safe for logging
   */
  static getSafeUrl(): string {
    return maskUrl(_credentials.url);
  }

  /**
   * Gets a redacted version of the API key for logging
   * @returns Redacted key safe for logging
   */
  static getSafeKey(): string {
    return redactString(_credentials.key, 6);
  }

  /**
   * Checks if credentials are configured
   * @returns True if both URL and key are present
   */
  static isConfigured(): boolean {
    return !!_credentials.url && !!_credentials.key;
  }

  /**
   * Validates configuration and returns safe diagnostic info
   * @returns Validation result with safe-to-log information only
   */
  static validate(): {
    isValid: boolean;
    errors: string[];
    safeInfo: Record<string, string>;
  } {
    const errors: string[] = [];
    const safeInfo: Record<string, string> = {};

    // Check URL
    if (!_credentials.url) {
      errors.push('Missing VITE_SUPABASE_URL');
    } else {
      safeInfo['URL'] = maskUrl(_credentials.url);
      
      // Validate URL format
      try {
        const urlObj = new URL(_credentials.url);
        safeInfo['Protocol'] = urlObj.protocol;
        
        if (!urlObj.protocol.startsWith('http')) {
          errors.push('URL must use HTTP/HTTPS protocol');
        }
        
        if (!_credentials.url.includes('supabase.co')) {
          errors.push('URL does not appear to be a Supabase URL');
        }
      } catch {
        errors.push('URL format is invalid');
      }
      
      // Check for placeholders
      if (_credentials.url.includes('your-project') || _credentials.url.includes('example')) {
        errors.push('URL contains placeholder values');
      }
    }

    // Check API Key
    if (!_credentials.key) {
      errors.push('Missing VITE_SUPABASE_ANON_KEY');
    } else {
      safeInfo['Key Format'] = _credentials.key.startsWith('eyJ') ? 'Valid JWT' : 'Invalid';
      safeInfo['Key Length'] = `${_credentials.key.length} chars`;
      safeInfo['Key Preview'] = redactString(_credentials.key, 6);
      
      if (!_credentials.key.startsWith('eyJ')) {
        errors.push('API key does not appear to be a valid JWT token');
      }
      
      if (_credentials.key.length < 100) {
        errors.push('API key seems too short');
      }
      
      if (_credentials.key.includes('your-') || _credentials.key.includes('example')) {
        errors.push('API key contains placeholder values');
      }
    }

    // Environment info (safe to log)
    safeInfo['Environment'] = import.meta.env.MODE;
    safeInfo['Dev Mode'] = import.meta.env.DEV ? 'Yes' : 'No';

    return {
      isValid: errors.length === 0,
      errors,
      safeInfo,
    };
  }

  /**
   * Sanitizes an error object by removing any credential information
   * @param error The error to sanitize
   * @returns Sanitized error safe for logging
   */
  static sanitizeError(error: any): any {
    if (!error) return error;

    const sanitized = { ...error };
    
    // Convert to string for searching
    const errorStr = JSON.stringify(error);
    
    // If credentials appear in error, redact them
    if (_credentials.url && errorStr.includes(_credentials.url)) {
      sanitized._containsUrl = true;
      sanitized.safeUrl = maskUrl(_credentials.url);
    }
    
    if (_credentials.key && errorStr.includes(_credentials.key)) {
      sanitized._containsKey = true;
      sanitized.safeKey = redactString(_credentials.key, 6);
    }

    // Redact message if it contains credentials
    if (sanitized.message) {
      let message = sanitized.message;
      if (_credentials.url) {
        message = message.replace(new RegExp(_credentials.url, 'g'), maskUrl(_credentials.url));
      }
      if (_credentials.key) {
        message = message.replace(new RegExp(_credentials.key, 'g'), '[REDACTED_KEY]');
      }
      sanitized.message = message;
    }

    return sanitized;
  }

  /**
   * Generates a safe configuration report for logging/debugging
   * @returns Safe configuration information
   */
  static getConfigReport(): {
    configured: boolean;
    url: string;
    key: string;
    environment: string;
    warnings: string[];
  } {
    const validation = this.validate();
    const warnings: string[] = [];

    // Add security warnings
    if (import.meta.env.DEV && !validation.isValid) {
      warnings.push('Configuration is incomplete - see errors for details');
    }

    if (import.meta.env.PROD && !validation.isValid) {
      warnings.push('⚠️ PRODUCTION: Invalid configuration detected');
    }

    return {
      configured: validation.isValid,
      url: this.getSafeUrl(),
      key: this.getSafeKey(),
      environment: import.meta.env.MODE,
      warnings: validation.errors.length > 0 ? validation.errors : warnings,
    };
  }
}

/**
 * Prints a safe configuration report to console
 * This function ensures no sensitive data is logged
 */
export function printSafeConfigReport(): void {
  const report = SecureConfig.getConfigReport();

  console.group('🔒 Secure Configuration Report');
  
  console.log(`Status: ${report.configured ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`Environment: ${report.environment}`);
  console.log(`URL: ${report.url}`);
  console.log(`Key: ${report.key}`);
  
  if (report.warnings.length > 0) {
    console.group('⚠️ Warnings/Errors');
    report.warnings.forEach(w => console.warn(`  • ${w}`));
    console.groupEnd();
  }

  console.groupEnd();

  if (!report.configured) {
    console.log('\n📖 Setup guide: ENV_SETUP.md');
    console.log('🔐 Security: Never log actual credential values');
  }
}

/**
 * Helper to validate that a value doesn't contain credentials
 * Useful for validating data before logging
 */
export function isSafeToLog(value: any): boolean {
  if (!value) return true;
  
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  
  return !str.includes(_credentials.url) && !str.includes(_credentials.key);
}

/**
 * Sanitizes any value for safe logging
 */
export function sanitizeForLog(value: any): any {
  if (!value) return value;
  
  if (typeof value === 'string') {
    let safe = value;
    if (_credentials.url) {
      safe = safe.replace(new RegExp(_credentials.url, 'g'), maskUrl(_credentials.url));
    }
    if (_credentials.key) {
      safe = safe.replace(new RegExp(_credentials.key, 'g'), '[REDACTED_KEY]');
    }
    return safe;
  }
  
  if (typeof value === 'object') {
    return SecureConfig.sanitizeError(value);
  }
  
  return value;
}

// Export a default instance
export default SecureConfig;
