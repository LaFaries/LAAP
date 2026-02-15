exports.handler = async (event) => {
  try {

    const data = JSON.parse(event.body || "{}");

    const name = data.name || "Unknown";
    const email = data.email || "";
    const role = data.role || "";
    const type = data.type || "General";

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
                text: { content: name }
              }
            ]
          },
          Email: {
            email: email || null
          },
          Role: {
            rich_text: [
              {
                text: { content: role }
              }
            ]
          },
          Type: {
            select: {
              name: type
            }
          }
        }
      })
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
