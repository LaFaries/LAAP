exports.handler = async (event) => {
  try {

    const data = JSON.parse(event.body || "{}");

    const name = data.name || "Unknown";
    const email = data.email || "No Email";
    const message = data.message || "No Message";

    /* ========= NOTION INSERT =========
       You will replace these later with your real values
    */

    const NOTION_KEY = process.env.NOTION_API_KEY;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

  const response = await fetch("https://api.notion.com/v1/pages", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID
    },
    properties: {
      Name: {
        title: [
          {
            text: { content: data.name || "New Intake" }
          }
        ]
      },
      Email: {
        email: data.email || null
      },
      Role: {
        rich_text: [
          {
            text: { content: data.role || "" }
          }
        ]
      },
      Type: {
        select: {
          name: data.type || "General"
        }
      }
    }
  })
});
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };

  }
};
