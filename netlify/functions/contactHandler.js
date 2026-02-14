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

    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: {
          Name: {
            title: [
              {
                text: { content: name }
              }
            ]
          },
          Email: {
            rich_text: [
              {
                text: { content: email }
              }
            ]
          },
          Message: {
            rich_text: [
              {
                text: { content: message }
              }
            ]
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
