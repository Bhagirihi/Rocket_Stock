// Helper function to fetch data from API
async function fetchAPI(endpoint, errorPrefix) {
  const BASE_URL = "https://www.nseindia.com/api";
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0",
    Referer: "https://www.nseindia.com/",
  };
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${errorPrefix} ${response.status}: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`${errorPrefix}:`, error.message);
    return null;
  }
}

// Fetch 52-week high and low for a stock
async function fetchHighLow(symbol) {
  const endpoint = `live-analysis-52Week/search?sym=${symbol}`;
  const errorPrefix = `Error fetching 52-week data for ${symbol}`;
  return (
    (await fetchAPI(endpoint, errorPrefix)) || { yearHigh: "0", yearLow: "0" }
  );
}

// Fetch and analyze stock data
async function fetchStockData() {
  try {
    // Fetch top gainers, losers, and OI data concurrently
    const [gainersData, losersData, oiData] = await Promise.all([
      fetchAPI("live-analysis-variations?index=gainers", "Error TOP GAINERS"),
      fetchAPI("live-analysis-variations?index=loosers", "Error TOP LOSERS"),
      fetchAPI("live-analysis-oi-spurts-underlyings", "Error OI DATA"),
    ]);

    // Filter gainers and losers
    const gainers =
      gainersData?.FOSec?.data?.filter((item) => item.perChange > 2) || [];
    const losers =
      losersData?.FOSec?.data?.filter((item) => item.perChange < -2) || [];

    // Filter OI data
    const oiFiltered = oiData?.data?.filter((item) => item.avgInOI > 7) || [];
    const oiSymbols = new Set(oiFiltered.map((item) => item.symbol));

    // Combine data for matching symbols
    const combinedData = [...gainers, ...losers]
      .filter((item) => oiSymbols.has(item.symbol))
      .map((item) => ({
        symbol: item.symbol,
        ltp: item.ltp,
        perChange: item.perChange,
        avgInOI:
          oiFiltered.find((oi) => oi.symbol === item.symbol)?.avgInOI || 0,
      }));

    // Fetch 52-week high and low data
    const enrichedData = await Promise.all(
      combinedData.map(async (stock) => {
        const { yearHigh, yearLow } = await fetchHighLow(stock.symbol);
        return { ...stock, yearHigh, yearLow };
      })
    );

    // Analyze each stock
    const analysisResults = enrichedData.map((stock) => {
      const analysis = analyzeStock(stock);
      return { ...stock, ...analysis };
    });

    console.log("Analysis Results:", analysisResults);
    return (
      analysisResults || [
        {
          symbol: "OOPS !!",
          ltp: "-",
          yearHigh: "0",
          yearLow: "0",
          perChange: "-",
          avgInOI: "-",
          rangePosition: "NaN%",
          trend: "-",
          breakoutSignal: "-",
          optionSuggestion: "-",
        },
      ]
    );
  } catch (error) {
    console.error("Error fetching stock data:", error.message);
    return [];
  }
}

// Analysis function (unchanged)
function analyzeStock(data) {
  const ltp = data?.ltp || 0;
  const high52 = parseFloat(data?.yearHigh) || 0;
  const low52 = parseFloat(data?.yearLow) || 0;
  const changeInOI = data?.avgInOI || 0;
  const priceChange = data?.perChange || 0;

  const rangePosition = ((ltp - low52) / (high52 - low52)) * 100 || 0;

  let trend = "";
  if (changeInOI > 0 && priceChange > 0)
    trend = "Bullish (Strong Buy Interest)";
  else if (changeInOI > 0 && priceChange < 0)
    trend = "Bearish (Strong Sell Interest)";
  else if (changeInOI < 0 && priceChange > 0)
    trend = "Short Covering (Unwinding of Short Positions)";
  else if (changeInOI < 0 && priceChange < 0)
    trend = "Long Unwinding (Profit Booking)";
  else trend = "Uncertain (Low Activity)";

  let breakoutSignal = "";
  if (ltp >= high52 * 0.98)
    breakoutSignal = "Near 52-week High: Possible Breakout.";
  else if (ltp <= low52 * 1.02)
    breakoutSignal = "Near 52-week Low: Possible Breakdown.";
  else breakoutSignal = "In Range: No Immediate Breakout/Breakdown Signal.";

  let optionSuggestion = trend.includes("Bullish")
    ? "Consider buying a Call Option."
    : trend.includes("Bearish")
    ? "Consider buying a Put Option."
    : "No strong option suggestion.";

  return {
    rangePosition: `${rangePosition.toFixed(2)}% within 52-week range`,
    trend,
    breakoutSignal,
    optionSuggestion,
  };
}

module.exports = {
  fetchStockData,
};
