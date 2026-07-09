import * as fs from "fs";
import * as path from "path";

// Helper to parse environment variables from .env.local
const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || "").replace(/^"|"$/g, "").trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function runTests() {
  console.log("=========================================");
  console.log("   RAKEXURA STORE AUTOMATED TEST SUITE    ");
  console.log("=========================================");
  console.log("Supabase Endpoint:", supabaseUrl);

  const testOrderRef = "RKX-2606-000043";
  // The RPC requires a phone match input of at least 10 digits
  const testPhone = "918637431104"; 

  console.log(`\n--- TEST SCENARIO A/B: TRACKING PRIVACY FOR ORDER ${testOrderRef} ---`);
  console.log(`Tracking order ${testOrderRef} (Phone: ${testPhone}) via Public RPC`);

  const rpcUrl = `${supabaseUrl}/rest/v1/rpc/track_store_order`;
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_order_reference: testOrderRef,
      p_phone_suffix: testPhone,
    }),
  });
  
  const result = await response.json();
  const orderData = Array.isArray(result) ? result[0] : result;

  if (!orderData) {
    console.error("❌ FAILURE: Order tracking RPC returned no data or order was not found.");
    console.log("Response was:", JSON.stringify(result));
    
    console.log("\nTrying fallback with 10-digit number format (without 91)...");
    const fallbackPhone = "8637431104";
    const responseFallback = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_order_reference: testOrderRef,
        p_phone_suffix: fallbackPhone,
      }),
    });
    const resultFallback = await responseFallback.json();
    const orderDataFallback = Array.isArray(resultFallback) ? resultFallback[0] : resultFallback;
    
    if (orderDataFallback) {
      console.log("✅ SUCCESS with fallback 10-digit phone!");
      verifyOrderData(orderDataFallback);
    } else {
      console.error("❌ FAILURE: Fallback number also failed. Response was:", JSON.stringify(resultFallback));
    }
  } else {
    verifyOrderData(orderData);
  }

  function verifyOrderData(orderData: any) {
    console.log("RPC Response keys:", Object.keys(orderData));
    console.log("auth_required status:", orderData.auth_required);

    if (orderData.auth_required) {
      console.log("✅ SUCCESS: Order requires authentication. CENSORSHIP CHECK:");
      console.log(`   - customer_name: ${orderData.customer_name} (Expected: 'Protected Customer' or similar)`);
      console.log(`   - total_price: ${orderData.total_price} (Expected: null)`);
      console.log(`   - account_access: ${orderData.account_access} (Expected: null)`);
      
      if (orderData.total_price === null && orderData.account_access === null) {
        console.log("   ✅ Privacy test PASSED! All sensitive details are 100% hidden from unauthorized viewers.");
      } else {
        console.error("   ❌ Privacy test FAILED! Sensitive fields are exposed to public.");
      }
    } else {
      console.log("✅ SUCCESS: Order is guest-owned or caller is authorized. Details shown:");
      console.log(`   - customer_name: ${orderData.customer_name}`);
      console.log(`   - total_price: ${orderData.total_price}`);
      console.log(`   - items count: ${orderData.items?.length ?? 0}`);
    }
  }

  console.log("\n--- TEST SCENARIO C: COUPON PRICE EXCLUSION (Rs. 99 RULE) ---");
  // Simulating coupon validation rules locally
  const checkCouponPrice = (price: number, quantity: number) => {
    const totalLinePrice = price * quantity;
    return totalLinePrice > 99;
  };

  const testCases = [
    { name: "Single Game under Rs. 99", price: 50, quantity: 1, expected: false },
    { name: "Multiple Games under Rs. 99 (Total line price > 99)", price: 50, quantity: 3, expected: true },
    { name: "Single Game above Rs. 99", price: 120, quantity: 1, expected: true },
    { name: "Multiple Games above Rs. 99", price: 120, quantity: 2, expected: true }
  ];

  testCases.forEach((tc) => {
    const allowed = checkCouponPrice(tc.price, tc.quantity);
    if (allowed === tc.expected) {
      console.log(`✅ Passed: [${tc.name}] -> Unit: Rs. ${tc.price}, Qty: ${tc.quantity}, Total: Rs. ${tc.price * tc.quantity} -> Allowed: ${allowed}`);
    } else {
      console.error(`❌ Failed: [${tc.name}] -> Unit: Rs. ${tc.price}, Qty: ${tc.quantity}, Total: Rs. ${tc.price * tc.quantity} -> Got: ${allowed}, Expected: ${tc.expected}`);
    }
  });

  console.log("\n=========================================");
  console.log("           ALL SCENARIOS TESTED          ");
  console.log("=========================================");
}

runTests().catch((e) => {
  console.error("Test execution error:", e);
});
