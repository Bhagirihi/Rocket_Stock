const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { fetchStockData } = require("./utils2");
const PORT = 3001;
let { SmartAPI, WebSocket, WebSocketV2 } = require("smartapi-javascript");

// Serve static files
app.use(express.static("public"));

// Enable CORS for all routes
app.use(cors());

app.get("/", (req, res) => {
  socket.emit("getData");
  res.send({ message: "Launch", done });
});

const desireData = async (socket) => {
  const rocketStocks = await fetchStockData();
  console.log("From desireData", rocketStocks);
  if (rocketStocks.length > 0) {
    await socket.emit("rocketStocks", rocketStocks);
  }
};

// Handle socket connections
io.on("connection", (socket) => {
  console.log("Client connected");
  let intervalId; // Declare intervalId at a broader scope
  desireData(socket);

  intervalId = setInterval(async () => {
    desireData(socket);
  }, 10000);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
