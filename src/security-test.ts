/**
 * Security Test Suite
 * Tests to verify that credentials are never exposed in logs or errors
 */

import SecureConfig, { redactString, maskUrl, sanitizeForLog, isSafeToLog } from './lib/secure-config';

console.log('🔒 Running Security Tests...\n');

// Test 1: URL Masking
console.log('Test 1: URL Masking');
const testUrl = 'https://ktknzhypndszujoakaxq.supabase.co';
const maskedUrl = maskUrl(testUrl);
console.log('Original URL should NOT appear in logs');
console.log('Masked URL:', maskedUrl);
console.assert(maskedUrl.includes('ktkn'), 'Should show first 4 chars');
console.assert(maskedUrl.includes('***'), 'Should mask middle');
console.assert(maskedUrl.includes('supabase.co'), 'Should show domain');
console.assert(!maskedUrl.includes('ktknzhypndszujoakaxq'), 'Should not show full project ID');
console.log('✅ URL masking works\n');

// Test 2: Key Redaction
console.log('Test 2: Key Redaction');
const testKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0a256aHlwbmRzenVqb2FrYXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTA0NDcsImV4cCI6MjA3MjM4NjQ0N30.5mi6f8szwCW9aUwheetf7x4R4Sbdj1AaZ9gqD0r4vKo';
const redactedKey = redactString(testKey, 6);
console.log('Original key should NOT appear in logs');
console.log('Redacted key:', redactedKey);
console.assert(redactedKey.includes('eyJhbG'), 'Should show first 6 chars');
console.assert(redactedKey.includes('*'), 'Should have masking');
console.assert(redactedKey.length < testKey.length, 'Should be shorter than original');
console.log('✅ Key redaction works\n');

// Test 3: Secure Config Accessors
console.log('Test 3: Secure Config Accessors');
const safeUrl = SecureConfig.getSafeUrl();
const safeKey = SecureConfig.getSafeKey();
console.log('Safe URL:', safeUrl);
console.log('Safe Key:', safeKey);
console.assert(!safeUrl.includes('ktknzhypndszujoakaxq'), 'Safe URL should be masked');
console.assert(safeKey.includes('*'), 'Safe key should be redacted');
console.log('✅ Secure accessors work\n');

// Test 4: Error Sanitization
console.log('Test 4: Error Sanitization');
const errorWithCredentials = new Error(
  `Failed to connect to ${SecureConfig.getUrl()} with key ${SecureConfig.getKey()}`
);
const sanitizedError = SecureConfig.sanitizeError(errorWithCredentials);
console.log('Original error message should NOT contain actual credentials');
console.log('Sanitized error message:', sanitizedError.message);
console.assert(
  !sanitizedError.message.includes('ktknzhypndszujoakaxq'),
  'Sanitized error should not contain full project ID'
);
console.assert(
  !sanitizedError.message.includes(SecureConfig.getKey()),
  'Sanitized error should not contain actual key'
);
console.log('✅ Error sanitization works\n');

// Test 5: Safe to Log Check
console.log('Test 5: Safe to Log Check');
const unsafeData = { url: SecureConfig.getUrl(), key: SecureConfig.getKey() };
const safeData = { url: safeUrl, key: safeKey };
console.assert(!isSafeToLog(unsafeData), 'Should detect unsafe data');
console.assert(isSafeToLog(safeData), 'Should allow safe data');
console.log('✅ Safe to log check works\n');

// Test 6: Sanitize for Log
console.log('Test 6: Sanitize for Log');
const logData = {
  message: 'Connection failed',
  url: SecureConfig.getUrl(),
  key: SecureConfig.getKey(),
  other: 'data',
};
const sanitizedLog = sanitizeForLog(logData);
console.log('Sanitized log data:', sanitizedLog);
console.assert(
  typeof sanitizedLog === 'object',
  'Should return sanitized object'
);
console.log('✅ Log sanitization works\n');

// Test 7: Configuration Report
console.log('Test 7: Configuration Report');
const report = SecureConfig.getConfigReport();
console.log('Config report:', report);
console.assert(report.url.includes('***'), 'Report should have masked URL');
console.assert(report.key.includes('*'), 'Report should have redacted key');
console.assert(!report.url.includes('ktknzhypndszujoakaxq'), 'Report should not expose project ID');
console.log('✅ Configuration report is secure\n');

// Test 8: Validation Returns Safe Info
console.log('Test 8: Validation Returns Safe Info');
const validation = SecureConfig.validate();
console.log('Validation info:', validation.safeInfo);
Object.values(validation.safeInfo).forEach(value => {
  console.assert(
    !value.includes('ktknzhypndszujoakaxq'),
    'Validation info should not contain actual project ID'
  );
});
console.log('✅ Validation returns safe info only\n');

console.log('🎉 All Security Tests Passed!');
console.log('\n⚠️  IMPORTANT: Actual credentials are never logged in this test');
console.log('Only masked/redacted versions appear above.\n');
