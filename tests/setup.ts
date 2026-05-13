// Vitest setup — runs before each test file
import { vi } from 'vitest';

// Mock environment variables for tests
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
process.env.CRON_SECRET = 'test-cron-secret';

// Suppress console noise during tests unless DEBUG_TESTS is set
if (!process.env.DEBUG_TESTS) {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
}
