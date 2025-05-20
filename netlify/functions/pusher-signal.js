import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const body = JSON.parse(event.body);
  const { room, signalData } = body;

  if (!room || !signalData) {
    return { statusCode: 400, body: "Missing room or signalData" };
  }

  try {
    await pusher.trigger(`room-${room}`, "signal", signalData);
    return { statusCode: 200, body: "Signal sent" };
  } catch (err) {
    return { statusCode: 500, body: "Error triggering Pusher event" };
  }
}
