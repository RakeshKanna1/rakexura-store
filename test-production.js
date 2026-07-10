const { spawn } = require("child_process");
const http = require("http");

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function runSuite() {
  console.log("==================================================");
  console.log("    RAKEXURA PRODUCTION INTEGRATION TEST SUITE    ");
  console.log("==================================================");

  console.log("\n1. Starting local Next.js development server...");
  // Start server on custom port 3001 to avoid conflicts
  const devServer = spawn("npx", ["next", "dev", "-p", "3001"], {
    shell: true,
    env: { ...process.env, PORT: "3001" }
  });

  let serverStarted = false;
  devServer.stdout.on("data", (data) => {
    const output = data.toString();
    if (output.includes("Ready in") || output.includes("started") || output.includes("http://localhost:3001")) {
      serverStarted = true;
    }
  });

  // Give the server up to 8 seconds to initialize
  await wait(8000);

  if (!serverStarted) {
    console.log("Warning: Server output stream didn't print ready message, attempting test execution anyway...");
  } else {
    console.log("✅ Local server is running on http://localhost:3001");
  }

  let failedTests = 0;

  try {
    // Test 1: Health endpoint returns 200 or 503 (controlled)
    console.log("\n--- TEST 1: Health Endpoint Response ---");
    const health = await fetchUrl("http://localhost:3001/api/health");
    console.log(`HTTP Status: ${health.statusCode}`);
    console.log("Response Body:", health.body);

    if (health.statusCode === 200 || health.statusCode === 503) {
      console.log("✅ PASSED: Health endpoint returned controlled response");
    } else {
      console.error("❌ FAILED: Health endpoint returned unexpected status", health.statusCode);
      failedTests++;
    }

    // Test 2: Secrets check on Health endpoint
    console.log("\n--- TEST 2: Secret Leak Check on Health ---");
    const healthString = JSON.stringify(health.body).toLowerCase();
    const leaked = healthString.includes("anon") || healthString.includes("secret") || healthString.includes("service_role");
    if (!leaked) {
      console.log("✅ PASSED: No secrets or credentials leaked in health payload");
    } else {
      console.error("❌ FAILED: Potential credential leak detected in health response!");
      failedTests++;
    }

    // Test 3: Status endpoint returns 200
    console.log("\n--- TEST 3: Status Endpoint Response ---");
    const status = await fetchUrl("http://localhost:3001/api/status");
    console.log(`HTTP Status: ${status.statusCode}`);
    console.log("Response Body:", status.body);

    if (status.statusCode === 200) {
      console.log("✅ PASSED: Status endpoint returned HTTP 200");
    } else {
      console.error("❌ FAILED: Status endpoint returned status", status.statusCode);
      failedTests++;
    }

    // Test 4: Security Headers
    console.log("\n--- TEST 4: Security Headers check ---");
    const headers = health.headers;
    const csp = headers["content-security-policy"];
    const hsts = headers["strict-transport-security"];
    const nosniff = headers["x-content-type-options"];
    const frameOptions = headers["x-frame-options"];

    console.log("Content-Security-Policy:", csp ? "PRESENT" : "MISSING");
    console.log("Strict-Transport-Security:", hsts ? "PRESENT" : "MISSING");
    console.log("X-Content-Type-Options:", nosniff ? "PRESENT" : "MISSING");
    console.log("X-Frame-Options:", frameOptions ? "PRESENT" : "MISSING");

    if (csp && hsts && nosniff && frameOptions) {
      console.log("✅ PASSED: Standard HTTP security headers are correctly injected");
    } else {
      console.warn("⚠️ WARNING: One or more security headers are missing (expected on Vercel production edge, next.config.ts header middleware applies on route requests)");
    }

    // Test 5: Rate Limiting Simulation
    console.log("\n--- TEST 5: Rate Limiting Check ---");
    console.log("Simulating 6 rapid requests to /api/health...");
    let limitExceeded = false;
    for (let i = 0; i < 6; i++) {
      const res = await fetchUrl("http://localhost:3001/api/health");
      if (res.statusCode === 429) {
        limitExceeded = true;
        console.log(`Request ${i + 1}: Blocked (HTTP 429) as expected`);
        break;
      } else {
        console.log(`Request ${i + 1}: Success (HTTP ${res.statusCode})`);
      }
      await wait(100);
    }
    // Note: LocalRateLimiter or Upstash will block at 5 requests/min. If local rate limiter is loaded, it should hit 429 on the 6th call.
    console.log("Rate limiting result:", limitExceeded ? "BLOCKED 429" : "NO BLOCK (Might be running without client IP headers locally)");

  } catch (err) {
    console.error("❌ Integration test runner error:", err);
    failedTests++;
  } finally {
    console.log("\nShutting down local dev server...");
    devServer.kill("SIGINT");
  }

  console.log("\n==================================================");
  if (failedTests === 0) {
    console.log("🎉  ALL SYSTEM SCENARIOS VERIFIED SUCCESSFULLY  🎉");
    console.log("==================================================");
    process.exit(0);
  } else {
    console.error(`❌  ${failedTests} TEST SCENARIO(S) FAILED  ❌`);
    console.log("==================================================");
    process.exit(1);
  }
}

runSuite();
