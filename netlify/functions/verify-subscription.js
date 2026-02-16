/* ============================================================
   LAAP — verify-subscription.js
   Verifies a PayPal subscription ID is still active
   
   ENV VARS REQUIRED:
   PAYPAL_CLIENT_ID     → from PayPal Developer Dashboard
   PAYPAL_CLIENT_SECRET → from PayPal Developer Dashboard
   ============================================================ */

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" })
    };
  }

  const subscriptionId = data.subscriptionId;

  if (!subscriptionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        verified: false,
        reason: "No subscription ID provided"
      })
    };
  }

  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing PayPal credentials in environment variables");
    return {
      statusCode: 500,
      body: JSON.stringify({
        verified: false,
        reason: "Server configuration error — PayPal credentials missing"
      })
    };
  }

  try {
    /* Get PayPal OAuth token */
    const authRes = await fetch(
      "https://api-m.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      }
    );

    const authData = await authRes.json();

    if (!authData.access_token) {
      console.error("PayPal auth failed:", authData);
      return {
        statusCode: 401,
        body: JSON.stringify({
          verified: false,
          reason: "Could not authenticate with PayPal"
        })
      };
    }

    /* Check subscription status */
    const subRes = await fetch(
      `https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          "Authorization": `Bearer ${authData.access_token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const subData = await subRes.json();
    const isActive = subData.status === "ACTIVE";

    console.log(`Subscription ${subscriptionId}: ${subData.status}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        verified: isActive,
        status:   subData.status,
        reason:   isActive
          ? "Subscription active"
          : `Subscription is ${subData.status}`
      })
    };

  } catch (err) {
    console.error("Verification error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        verified: false,
        reason: err.message
      })
    };
  }
};
