const Pusher = require("pusher");
const fetch = require("node-fetch"); // fallback if native fetch isn't supported

const pusher = new Pusher({
  appId: "1995307",
  key: "e10c1ec0ce48bfccc178",
  secret: process.env.PUSHER_SECRET,
  cluster: "eu",
  useTLS: true
});

exports.handler = async function (event) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: "Invalid JSON in request body"
    };
  }

  const { room, message } = body;

  try {
    // Always try to trigger the Pusher message first
    await pusher.trigger(`room-${room}`, "message", { encrypted: message });
  } catch (err) {
    console.error("Pusher trigger failed:", err);
    return {
      statusCode: 500,
      body: "Failed to send Pusher message"
    };
  }

  // Now try to fire webhook separately (fail silently)
  try {
    const rawHooks = process.env.DISCORD_WEBHOOKS || "[]";
    const webhooks = JSON.parse(rawHooks);

    const meta = JSON.parse(event.headers["x-message-meta"] || "{}");
    const { key, nickname, pfp, text } = meta;

    for (const hook of webhooks) {
      if (hook.room === room && hook.key === key) {
        await fetch(hook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: nickname || "Anon",
            avatar_url: pfp || "https://placehold.co/32",
            content: text || "[no message text]"
          })
        });
      }
    }
  } catch (err) {
    console.warn("Webhook skipped due to error:", err.message);
    // No return — webhook errors shouldn't affect the result
  }

  return {
    statusCode: 200,
    body: "Message sent (webhook optional)"
  };
};
