function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTopGainer() {
  try {
    return fetch(
      "https://www.nseindia.com/api/live-analysis-variations?index=gainers",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: {},
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error TOP ${response.status}`);
        }
        return response.json(); // Parse JSON response
      })
      .then(async function (response) {
        const Gainer = await response?.FOSec?.data?.filter(
          (item) => item.perChange > 2
        );
        console.log("Top Gainers", true);
        return Gainer || [];
      })
      .catch(function (error) {
        console.error("Error TOP:", error.response?.data || error.message);
      });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchTopLooser() {
  try {
    return fetch(
      "https://www.nseindia.com/api/live-analysis-variations?index=loosers",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: {},
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error LOOSER ${response.status}`);
        }
        return response.json(); // Parse JSON response
      })
      .then(async function (response) {
        const Looser = await response?.FOSec?.data?.filter(
          (item) => item.perChange < -2
        );
        console.log("Top Looser", true);
        return Looser || [];
      })
      .catch(function (error) {
        console.error("Error LOOSER:", error.response?.data || error.message);
      });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchTopOI(delayMs = 1000) {
  try {
    return fetch(
      "https://www.nseindia.com/api/live-analysis-oi-spurts-underlyings",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: {},
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error OI ${response.status} ${errorText}`);
        }
        return response.json(); // Parse JSON response
      })
      .then(async function (response) {
        const OIData = response?.data?.filter((item) => item.avgInOI > 7);
        const map = new Map();
        // await delay(delayMs);
        const Gainer = await fetchTopGainer();
        //   await delay(delayMs);

        const Looser = await fetchTopLooser();
        //    await delay(delayMs);

        const referenceNames = OIData.map((item) => item.symbol);
        let common1 =
          Gainer.filter((item) => referenceNames.includes(item.symbol)) || [];

        let common2 =
          Looser.filter((item) => referenceNames.includes(item.symbol)) || [];

        const GainerLooser = [...common1, ...common2];
        // Add data from the first array
        GainerLooser.forEach((item) => {
          map.set(item.symbol, { ...item, source1: true }); // Add a flag to identify the source
        });

        // Add data from the second array
        OIData.forEach(async (item) => {
          if (map.has(item.symbol)) {
            const data = await fetchHighLow(item.symbol);
            // Merge data if the name exists in both arrays
            map.set(item.symbol, {
              ...map.get(item.symbol),
              ...item,
              ...data,
              source2: true,
            });
          }
        });

        //  analyzeStock(Array.from(map.values()));
        return Array.from(map.values());
      })
      .catch(function (error) {
        console.error("Error OI ->:", error.response?.data || error.message);
      });

    // Wait for the specified delay
    // await delay(delayMs);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchFOSec(symbol, ltp, perChange) {
  console.log(symbol, ltp, perChange);
  try {
    const response = await fetch(
      `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error FOSEC ${response.status}, https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`
      );
    }

    const data = await response.json();
    const exp = data.records.expiryDates[0];
    const expData = data.records.data.filter(
      (item) =>
        item.expiryDate === exp &&
        item.strikePrice === Math.floor(ltp / 100) * 100
    );
    const expDataValue = perChange > 2 ? "CE" : perChange < -2 ? "PE" : "CE";
    const FOSec = expData[expDataValue];

    return { symbol, FOSec }; // Return symbol and its fetched data
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error.message);
    return { symbol, error: error.message }; // Handle errors per symbol
  }
}

async function fetchAllFOSec(symbolsWithLtp) {
  const fetchPromises = symbolsWithLtp.map(({ symbol, ltp, perChange }) => {
    delay(2000), fetchFOSec(symbol, ltp, perChange);
  });

  const results = await Promise.all(fetchPromises); // Run all fetches concurrently
  console.log("results", results);

  !results.includes(undefined) &&
    results.forEach(({ symbol, FOSec, error }) => {
      if (error) {
        console.log(`Error for symbol ${symbol}: ${error}`);
      } else {
        console.log(`Data for symbol ${symbol}:`, FOSec);
      }
    });
}

async function fetchHighLow(symbol) {
  try {
    const response = await fetch(
      `https://www.nseindia.com/api/live-analysis-52Week/search?sym==${symbol}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error FOSEC ${response.status}, https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`
      );
    }

    const data = await response.json();
    console.log("52 Week", data[0]);

    return data; // Return symbol and its fetched data
  } catch (error) {
    console.error(`Error fetching 52 Week data for ${symbol}:`, error.message);
    return { symbol, error: error.message }; // Handle errors per symbol
  }
}

// Analysis Function
async function analyzeStock(data) {
  const ltp = data.ltp;
  const high52 = data.yearHigh.split(" ")[0];
  const low52 = data.yearLow.split(" ")[0];
  const changeInOI = data.avgInOI;
  const priceChange = data.perChange;

  // Calculate the stock's position in the 52-week range
  const rangePosition = ((ltp - low52) / (high52 - low52)) * 100;

  // Determine trend based on Change in OI and Price Change
  let trend = "";
  if (changeInOI > 0 && priceChange > 0) {
    trend = "Bullish (Strong Buy Interest)";
  } else if (changeInOI > 0 && priceChange < 0) {
    trend = "Bearish (Strong Sell Interest)";
  } else if (changeInOI < 0 && priceChange > 0) {
    trend = "Short Covering (Unwinding of Short Positions)";
  } else if (changeInOI < 0 && priceChange < 0) {
    trend = "Long Unwinding (Profit Booking)";
  } else {
    trend = "Uncertain (Low Activity)";
  }

  // Determine breakout/breakdown potential
  let breakoutSignal = "";
  if (ltp >= high52 * 0.98) {
    breakoutSignal = "Near 52-week High: Possible Breakout.";
  } else if (ltp <= low52 * 1.02) {
    breakoutSignal = "Near 52-week Low: Possible Breakdown.";
  } else {
    breakoutSignal = "In Range: No Immediate Breakout/Breakdown Signal.";
  }

  // Suggestions for Options
  let optionSuggestion = "";
  if (trend.includes("Bullish")) {
    optionSuggestion = "Consider buying a Call Option.";
  } else if (trend.includes("Bearish")) {
    optionSuggestion = "Consider buying a Put Option.";
  } else {
    optionSuggestion = "No strong option suggestion.";
  }

  // Output Results
  return {
    rangePosition: `${rangePosition.toFixed(2)}% within 52-week range`,
    trend,
    breakoutSignal,
    optionSuggestion,
  };
}

module.exports = {
  delay,
  fetchTopGainer,
  fetchTopLooser,
  fetchTopOI,
  fetchFOSec,
  fetchAllFOSec,
  fetchHighLow,
};
