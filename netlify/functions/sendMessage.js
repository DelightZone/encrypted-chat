const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1995307",
  key: "e10c1ec0ce48bfccc178",
  secret: process.env.PUSHER_SECRET,
  cluster: "eu",
  useTLS: true,
});

exports.handler = async function (event) {
  const { username, message } = JSON.parse(event.body);

  await pusher.trigger("chat-room", "message", {
    username,
    message,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
