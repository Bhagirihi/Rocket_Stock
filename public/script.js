const socket = io();

// Display data when received
socket.on("LooserData", (data) => {
  // const dataList = document.getElementById("dataListLooser");
  // dataList.innerHTML = ""; // Clear previous data
  const cardContainer = document.getElementById("dataListLooser");
  cardContainer.innerHTML = ""; // Clear previous data

  if (data?.length === 0) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <h3>Top Loser</h3>
        <p>Percentage: <span class="highlight">No Data Found.</span></p>
    `;
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <h3>Top Loser</h3>
        <p>Name: <span class="highlight">${item.symbol}</span></p>
        <p>Percentage: <span class="highlight">${item.perChange}%</span></p>
    `;
    cardContainer.appendChild(card);
  });
});

// Display data when received
socket.on("GainerData", (data) => {
  // const dataList = document.getElementById("dataListGainer");
  // dataList.innerHTML = ""; // Clear previous data
  const cardContainer = document.getElementById("dataListGainer");
  cardContainer.innerHTML = ""; // Clear previous data

  if (data?.length === 0) {
    card.className = "card";
    card.innerHTML = `
        <h3>Top Gainer</h3>
        <p>Percentage: <span class="highlight">No Data Found.</span></p>
    `;
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <h3>Top Gainer</h3>
        <p>Name: <span class="highlight">${item.symbol}</span></p>
        <p>Percentage: <span class="highlight">${item.perChange}%</span></p>
    `;
    cardContainer.appendChild(card);
  });
});

// Display data when received
socket.on("rocketStocks", (data) => {
  const cardContainer = document.getElementById("dataListOI");
  const now = new Date();
  document.getElementById(
    "last-updated"
  ).textContent = `Last Updated: ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}`;

  // data = [
  //   {
  //     symbol: "ULTRACEMCO",
  //     ltp: 12032,
  //     yearHigh: "0",
  //     yearLow: "0",
  //     perChange: 2.44,
  //     avgInOI: 8.02,
  //     rangePosition: "NaN% within 52-week range",
  //     trend: "Bullish (Strong Buy Interest)",
  //     breakoutSignal: "In Range: No Immediate Breakout/Breakdown Signal.",
  //     optionSuggestion: "Consider buying a Call Option.",
  //   },
  //   {
  //     symbol: "DMART",
  //     ltp: 3735,
  //     yearHigh: "0",
  //     yearLow: "0",
  //     perChange: -2.15,
  //     avgInOI: 9.2,
  //     rangePosition: "NaN% within 52-week range",
  //     trend: "Bearish (Strong Sell Interest)",
  //     breakoutSignal: "In Range: No Immediate Breakout/Breakdown Signal.",
  //     optionSuggestion: "Consider buying a Put Option.",
  //   },
  // ];

  // if (!data || data.length === 0) {
  //   const noDataMessage = document.createElement("div");
  //   noDataMessage.className = "no-data";
  //   noDataMessage.textContent = "No Data Found.";
  //   cardContainer.appendChild(noDataMessage);
  //   return; // Exit if no data
  // }

  console.log("DATA", data);
  data.forEach((item) => {
    cardContainer.innerHTML = ""; // Clear previous data
    console.log("DATA", item);
    const card = document.createElement("div");
    card.className = "card";

    let cardContent = `
      <div class="card-title">
        <span>${item.symbol || "N/A"}</span>
      </div>

      <div class="info-row">
        <p>LTP: <span class="${
          item.perChange >= 0 ? "positive" : "negative"
        }">₹${item.ltp || "N/A"}</span></p>
        <p>Change: <span class="${
          item.perChange >= 0 ? "positive" : "negative"
        }">${item.perChange}%</span></p>
        <p>OI: <span class="highlight">${item.avgInOI}%</span></p>
      </div>
    `;

    if (
      item.rangePosition &&
      !item.rangePosition.includes("NaN") &&
      !item.rangePosition.includes("Infinity")
    ) {
      cardContent += `
        <div class="info-row">
          <p>Range Position: <span class="highlight">${item.rangePosition}</span></p>
        </div>`;
    }
    if (Number(item.yearHigh) > 0 && Number(item.yearLow) > 0) {
      cardContent += `
        <div class="info-row">
          <p>Range Position: <span class="highlight">${item.rangePosition}</span></p>
        </div>`;
    }

    cardContent += `
    <div class="info-row">
        <p>52 Week high: <span class="highlight">${item.yearHigh}</span></p>
         <p>52 Week Low: <span class="highlight">${item.yearLow}</span></p>
      </div>

      <div class="info-row">
        <p>Trend: <span class="highlight">${item.trend}</span></p>
      </div>
      <div class="info-row">
        <p>Breakout Signal: <span class="highlight">${item.breakoutSignal}</span></p>
      </div>
      <div class="info-row">
        <p>Option Suggestion: <span class="highlight">${item.optionSuggestion}</span></p>
      </div>
    `;

    card.innerHTML = cardContent;
    cardContainer.appendChild(card);
  });
});
