const express = require("express");
const http = require("http");
const { socketIo, Server } = require("socket.io");
const axios = require("axios");
const cors = require("cors");
const puppeteer = require("puppeteer");
const app = express();
const server = http.createServer(app);
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3000/" // Local backend for development
    : "https://rocketstock.vercel.app"; // Production backend

const io = new Server(server, {
  cors: {
    origin: BASE_URL, // Replace with your frontend URL
    methods: ["GET", "POST"],
  },
});
const PORT = 3000;

app.use(cors());
app.use(express.static("public"));

let headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/",
};
const getCookiesWithPuppeteer = async () => {
  const browser = await puppeteer.launch({ headless: true }); // Launch Puppeteer in headless mode
  const page = await browser.newPage();

  // Set User-Agent to mimic a real browser
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0 Safari/537.36"
  );

  // Navigate to NSE India homepage
  await page.goto("https://www.nseindia.com", {
    waitUntil: "domcontentloaded",
  });

  // Extract cookies
  const cookies = await page.cookies();
  const cookieHeader = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  await browser.close(); // Close the browser

  return cookieHeader;
};

const fetchData = async (url) => {
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
};

const mergeDataBySymbol = (nifty50, niftyBank, oiData) => {
  const mergedData = [];
  const symbolMap = {};

  // Merge Nifty 50 data
  nifty50.forEach((item) => {
    symbolMap[item.symbol] = { ...item, type: "Nifty 50" };
  });

  // Merge Nifty Bank data
  niftyBank.forEach((item) => {
    if (symbolMap[item.symbol]) {
      symbolMap[item.symbol] = {
        ...symbolMap[item.symbol],
        ...item,
        type: "Nifty 50 & Nifty Bank",
      };
    } else {
      symbolMap[item.symbol] = { ...item, type: "Nifty Bank" };
    }
  });

  // Add filtered OI data
  oiData.forEach((item) => {
    if (symbolMap[item.symbol]) {
      symbolMap[item.symbol] = {
        ...symbolMap[item.symbol],
        latestOI: item.latestOI,
        prevOI: item.prevOI,
        changeInOI: item.changeInOI,
        avgInOI: item.avgInOI,
      };
    }
  });

  Object.values(symbolMap).forEach((data) => mergedData.push(data));
  return mergedData;
};

io.on("connection", async (socket) => {
  console.log("New client connected");
  console.log("Getting cookies with Puppeteer...");
  const cookieHeader = await getCookiesWithPuppeteer();
  console.log("Cookies retrieved:", cookieHeader);
  headers = {
    ...headers,
    Cookie: cookieHeader,
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  console.log("header", headers.length > 0);
  socket.emit("loader", false);
  socket.on("fetchData", async () => {
    const nifty50 = await fetchData(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050"
    );
    const niftyBank = await fetchData(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20BANK"
    );
    const oiData = await fetchData(
      "https://www.nseindia.com/api/live-analysis-oi-spurts-underlyings"
    );

    if (nifty50 && niftyBank && oiData) {
      const mergedData = mergeDataBySymbol(
        nifty50.data,
        niftyBank.data,
        oiData.data
      );
      console.log("mergedData", JSON.stringify(mergedData));

      socket.emit("updateData", mergedData);
    } else {
      socket.emit("error", "Failed to fetch data");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
