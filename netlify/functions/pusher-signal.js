const Pusher = require("pusher");
const fetch = require("node-fetch"); // if not available, use native `fetch`

const pusher = new Pusher({
  appId: "1995307",
  key: "e10c1ec0ce48bfccc178",
  secret: process.env.PUSHER_SECRET,
  cluster: "eu",
  useTLS: true
});

exports.handler = async function (event) {
  try {
    const { room, message } = JSON.parse(event.body);

    // Trigger to Pusher
    await pusher.trigger(`room-${room}`, "message", { encrypted: message });

    // Check if webhook needs to be fired
    const rawHooks = process.env.DISCORD_WEBHOOKS || "[]";
    const webhooks = JSON.parse(rawHooks);

    // Decode encrypted payload temporarily to access key/nickname/pfp
    // NOTE: This does NOT decrypt contents for user; just used for logic
    const decoded = Buffer.from(message, 'base64');
    const iv = decoded.slice(0, 12);
    const encryptedData = decoded.slice(12);

    // Optional: extract secret from request headers or force send it from client in body
    // But here we assume the client already includes the key and meta in the encrypted data.

    // Decrypt on server ONLY to match webhook condition
    // For now we ask client to include `meta` separately
    const { key, nickname, pfp, text } = JSON.parse(event.headers['x-message-meta'] || '{}');

    for (const hook of webhooks) {
      if (hook.room === room && hook.key === key) {
        // Send to Discord
        await fetch(hook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: nickname || "Anon",
            avatar_url: pfp || "https://placehold.co/32",
            content: text || "No message content"
          })
        });
      }
    }

    return {
      statusCode: 200,
      body: "Message sent + webhook (if matched)"
    };
  } catch (err) {
    console.error("Webhook trigger error:", err);
    return {
      statusCode: 500,
      body: "Error sending message"
    };
  }
};
