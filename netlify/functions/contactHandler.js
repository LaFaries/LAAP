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

 const token = process.env.NOTION_SECRET;
  const dbId  = process.env.NOTION_DATABASE_ID;

  if (!token) {
    console.error("NOTION_TOKEN is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server configuration error",
        detail: "NOTION_TOKEN is missing from Netlify environment variables"
      })
    };
  }

  if (!dbId) {
    console.error("NOTION_DATABASE_ID is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server configuration error",
        detail: "NOTION_DATABASE_ID is missing from Netlify environment variables"
      })
    };
  }

  const fullName  = data.fullName  || data.name  || "Unknown";
  const email     = data.email                   || null;
  const phone     = data.phone                   || "";
  const role      = data.role                    || "";
  const orgName   = data.orgName                 || "";
  const orgType   = data.type                    || "General";
  const plan      = data.plan     || data.tier   || "Free Preview";
  const paypalId  = data.paypalOrderId           || "";
  const startDate = new Date().toISOString().split("T")[0];

  console.log("contactHandler received:", { fullName, email, plan, paypalId });

  const properties = {
    "Name": {
      title: [{ text: { content: fullName } }]
    },
    "Role": {
      rich_text: [{ text: { content: role } }]
    },
    "Type": {
      select: { name: orgType }
    },
    "Plan": {
      select: { name: plan }
    },
    "Start Date": {
      date: { start: startDate }
    },
    "Status": {
      select: { name: "Active" }
    }
  };

  if (email) {
    properties["Email"] = { email: email };
  }

  if (phone) {
    properties["Phone"] = { phone_number: phone };
  }

  if (orgName) {
    properties["Organization"] = {
      rich_text: [{ text: { content: orgName } }]
    };
  }

  if (paypalId) {
    properties["PayPal Order ID"] = {
      rich_text: [{ text: { content: paypalId } }]
    };
  }

  let notionResponse;
  try {
    notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: properties
      })
    });
  } catch (networkErr) {
    console.error("Network error reaching Notion:", networkErr.message);
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "Could not reach Notion API",
        detail: networkErr.message
      })
    };
  }

  let notionData;
  try {
    notionData = await notionResponse.json();
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Could not parse Notion response" })
    };
  }

  if (!notionResponse.ok) {
    console.error("Notion API error:", notionData);

    let helpfulMessage = notionData.message || "Notion API error";

    if (notionResponse.status === 401) {
      helpfulMessage = "Invalid NOTION_TOKEN — make sure it starts with 'secret_' with no extra spaces";
    } else if (notionResponse.status === 404) {
      helpfulMessage = "Database not found — check NOTION_DATABASE_ID and make sure your integration is connected to the database in Notion";
    } else if (notionResponse.status === 400) {
      helpfulMessage = `Column name mismatch — check your Notion database columns: ${notionData.message}`;
    }

    return {
      statusCode: notionResponse.status,
      body: JSON.stringify({
        error: helpfulMessage,
        notionCode: notionData.code,
        notionMessage: notionData.message
      })
    };
  }

  console.log("Notion page created:", notionData.id);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      notionPageId: notionData.id,
      message: "Subscriber saved to Notion successfully"
    })
  };
};
