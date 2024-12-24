import { Server } from "socket.io";

export default function handler(req, res) {
  if (req.method === "GET") {
    const io = new Server(res.socket.server);
    io.on("connection", (socket) => {
      console.log("A user connected");
    });
    res.end();
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
