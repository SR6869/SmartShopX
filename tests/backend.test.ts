/**
 * SmartShopX Central Authority Backend Verification Test Suite
 * Validates Authentication, Tenant Security, Personal Isolation, Admin Authority, and POS Atomicity
 */

import { createApp } from '../server/app.js';
import http from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('--- STARTING SMARTSHOPX BACKEND VERIFICATION TESTS ---');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // Test 1: Health Check Endpoint
    try {
      const res = await fetch(`${baseUrl}/health`);
      const data = await res.json();
      assert(res.status === 200, `Health check returned ${res.status}`);
      assert(data.service === 'SmartShopX Central Authority', 'Service identity mismatch');
      results.push({ name: 'Health Check /api/v1/health', passed: true });
    } catch (e: any) {
      results.push({ name: 'Health Check /api/v1/health', passed: false, error: e.message });
    }

    // Test 2: Unauthorized request blocked
    try {
      const res = await fetch(`${baseUrl}/products`, {
        headers: { 'X-Store-Id': 'shop_101' },
      });
      assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
      results.push({ name: 'Auth Security: Unauthorized request rejected with 401', passed: true });
    } catch (e: any) {
      results.push({ name: 'Auth Security: Unauthorized request rejected with 401', passed: false, error: e.message });
    }

    // Test 3: Missing store header rejected
    try {
      const res = await fetch(`${baseUrl}/products`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
        },
      });
      assert(res.status === 400, `Expected 400 MissingStoreHeader, got ${res.status}`);
      results.push({ name: 'Tenant Security: Missing X-Store-Id header rejected with 400', passed: true });
    } catch (e: any) {
      results.push({ name: 'Tenant Security: Missing X-Store-Id header rejected with 400', passed: false, error: e.message });
    }

    // Test 4: Valid Auth & Tenant Scoping
    try {
      const res = await fetch(`${baseUrl}/products`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
      });
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(Array.isArray(await res.json()), 'Expected array of products');
      results.push({ name: 'Tenant Scoping: Authorized store access succeeds with 200', passed: true });
    } catch (e: any) {
      results.push({ name: 'Tenant Scoping: Authorized store access succeeds with 200', passed: false, error: e.message });
    }

    // Test 5: Personal Isolation (Zero Business Header Required)
    try {
      const res = await fetch(`${baseUrl}/personal/transactions`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
        },
      });
      assert(res.status === 200, `Expected 200 OK for personal transactions, got ${res.status}`);
      assert(Array.isArray(await res.json()), 'Expected array of personal transactions');
      results.push({ name: 'Personal Isolation: Personal endpoints isolated from business store headers', passed: true });
    } catch (e: any) {
      results.push({ name: 'Personal Isolation: Personal endpoints isolated from business store headers', passed: false, error: e.message });
    }

    // Test 6: Normal User blocked from Mother Admin operations
    try {
      const res = await fetch(`${baseUrl}/admin/stores`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
        },
      });
      // User role in dev mock is 'owner', not SUPER_ADMIN/ADMIN
      assert(res.status === 403, `Expected 403 Forbidden for non-admin, got ${res.status}`);
      results.push({ name: 'Admin Authority: Normal merchant forbidden from Mother Admin routes (403)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Admin Authority: Normal merchant forbidden from Mother Admin routes (403)', passed: false, error: e.message });
    }

    // Test 7: Subscription Quota API evaluates server limits
    try {
      const res = await fetch(`${baseUrl}/subscription/status`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
      });
      assert(res.status === 200, `Expected 200 OK for subscription status, got ${res.status}`);
      const data = await res.json();
      assert(data.quotas && data.quotas.products, 'Expected quota data in subscription response');
      results.push({ name: 'Subscription Authority: Server evaluates quotas and plan matrices', passed: true });
    } catch (e: any) {
      results.push({ name: 'Subscription Authority: Server evaluates quotas and plan matrices', passed: false, error: e.message });
    }

    // Test 8: POS Sale Validation (Empty items rejected)
    try {
      const res = await fetch(`${baseUrl}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
        body: JSON.stringify({ items: [], total: 100 }),
      });
      assert(res.status === 422, `Expected 422 ValidationError for empty cart, got ${res.status}`);
      results.push({ name: 'POS Atomicity: Invalid cart payload rejected with 422', passed: true });
    } catch (e: any) {
      results.push({ name: 'POS Atomicity: Invalid cart payload rejected with 422', passed: false, error: e.message });
    }
  } finally {
    server.close();
  }

  console.log('\n--- TEST RESULTS ---');
  let allPassed = true;
  for (const r of results) {
    if (r.passed) {
      console.log(`PASS: ${r.name}`);
    } else {
      console.log(`FAIL: ${r.name} - ${r.error}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\nALL 8 CORE AUTHORITY BACKEND TESTS PASSED!');
  } else {
    console.error('\nSOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
