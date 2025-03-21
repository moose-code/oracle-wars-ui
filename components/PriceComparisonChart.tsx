"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import "chartjs-adapter-date-fns";
import React from "react";

// Add these interfaces at the top of the file
interface PriceUpdate {
  id: string;
  updatedAt: number;
  value?: string;
  current?: string;
  nativeTokenUsed?: string;
}

// Add Binance kline interface
interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

// Add Binance trade interface
interface BinanceTrade {
  a: number; // Aggregate trade ID
  p: string; // Price
  q: string; // Quantity
  f: number; // First trade ID
  l: number; // Last trade ID
  T: number; // Timestamp (ms)
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
}

// Add custom 10-second candle interface
interface TenSecondCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
}

interface ChartContext {
  ctx: CanvasRenderingContext2D;
  chartArea: { left: number; top: number; width: number };
}

// Define zoom plugin types
interface ZoomPluginOptions {
  pan: {
    enabled: boolean;
    mode: "x" | "y" | "xy";
  };
  zoom: {
    wheel: { enabled: boolean };
    pinch: { enabled: boolean };
    mode: "x" | "y" | "xy";
    drag: { enabled: boolean };
  };
  limits?: {
    x?: {
      min: "original" | number;
      max: "original" | number;
    };
  };
}

// Update the dynamic import
const zoomPlugin =
  typeof window !== "undefined"
    ? import("chartjs-plugin-zoom").then((mod) => mod.default)
    : null;

if (typeof window !== "undefined") {
  Promise.resolve(zoomPlugin).then((plugin) => {
    if (plugin) {
      ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        TimeScale,
        plugin
      );
    }
  });
}

const watermarkPlugin = {
  id: "watermark",
  beforeDraw: (chart: ChartContext) => {
    const ctx = chart.ctx;
    const { width } = chart.chartArea;
    const x = chart.chartArea.left + width / 2;
    const y = chart.chartArea.top + 30; // Position it 30px below the top of the chart area

    ctx.save();
    ctx.globalAlpha = 0.07; // Very subtle transparency
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "48px Arial"; // Increased font size
    ctx.fillStyle = "rgb(100, 100, 100)";
    ctx.fillText("envio.dev", x, y);
    ctx.restore();
  },
};

ChartJS.register(watermarkPlugin);

// Define the chart options type
type ChartOptionsWithZoom = ChartOptions<"line"> & {
  plugins: {
    zoom: ZoomPluginOptions;
  };
};

// Make chart options configurable by selected feed
const createChartOptions = (selectedFeed: FeedType): ChartOptionsWithZoom => {
  const feed = FEEDS[selectedFeed];

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        padding: 10,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 12,
        },
        position: "nearest",
        animation: {
          duration: 150,
        },
        callbacks: {
          title: (context) => {
            const date = new Date(context[0].parsed.x);
            const formattedDate = format(date, "PP");
            const formattedTime = format(date, "HH:mm:ss");
            return `${formattedDate}, ${formattedTime}`;
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
          drag: {
            enabled: false,
          },
        },
        limits: {},
      },
    },
    scales: {
      x: {
        type: "time",
        min: Date.now() - feed.defaultTimeWindow,
        max: Date.now(),
        time: {
          unit: feed.timeUnit,
          displayFormats: {
            [feed.timeUnit]: feed.timeFormat,
          },
        },
        display: true,
        title: {
          display: true,
          text: "Time (UTC)",
        },
        ticks: {
          font: {
            size: 10,
          },
          maxTicksLimit: feed.maxTicksLimit,
          padding: 5,
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Price (USD)",
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };
};

// Update feed configuration with additional display settings
const FEEDS = {
  ETH_USD: {
    name: "ETH/USD",
    chainlinkAddress: "0x7d4E742018fb52E48b08BE73d041C18B21de6Fb5",
    hasRedstone: true,
    defaultTimeWindow: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    timeUnit: "hour" as const,
    timeFormat: "MMM d, HH:mm",
    maxTicksLimit: 8,
    binanceSymbol: "ETHUSDT",
  },
  BTC_USD: {
    name: "BTC/USD",
    chainlinkAddress: "0x014497a2AEF847C7021b17BFF70A68221D22AA63",
    hasRedstone: false,
    defaultTimeWindow: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
    timeUnit: "minute" as const,
    timeFormat: "HH:mm:ss",
    maxTicksLimit: 12,
    binanceSymbol: "BTCUSDT",
  },
};

type FeedType = "ETH_USD" | "BTC_USD";

// Update the fetchPriceData function with a corrected GraphQL query
async function fetchPriceData(selectedFeed: FeedType) {
  const feed = FEEDS[selectedFeed];
  const hasRedstone = feed.hasRedstone;

  // Check if we need to use a where clause for Redstone as well
  const redstoneQuery = hasRedstone
    ? `
        TransparentUpgradeableProxy_ValueUpdate(limit: 1000, order_by: {updatedAt: desc}) {
          id
          updatedAt
          value
          nativeTokenUsed
        }`
    : "";

  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query myQuery {
          ${redstoneQuery}
          AccessControlledOCR2Aggregator_AnswerUpdated(
            limit: 1000, 
            order_by: {updatedAt: desc}, 
            where: {feedAddress: {_eq: "${feed.chainlinkAddress}"}}
          ) {
            id
            updatedAt
            current
            nativeTokenUsed
            feedAddress
          }
        }
      `,
    }),
  });

  const responseData = await response.json();
  console.log("GraphQL Response:", responseData); // Debug logging
  return responseData;
}

// Replace the fetchBinanceData function with a more granular version
async function fetchBinanceData(symbol: string) {
  try {
    // Calculate a longer start time (3 hours ago to match BTC/USD default view)
    const now = Date.now();
    const startTime = now - 3 * 60 * 60 * 1000; // 3 hours ago

    console.log(
      `Fetching Binance data for ${symbol} from ${new Date(
        startTime
      ).toISOString()}`
    );

    // Try 1-second candles first (most granular)
    const oneSecondResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1s&limit=1000`
    );

    if (oneSecondResponse.ok) {
      const oneSecData = await oneSecondResponse.json();
      console.log(`Received ${oneSecData.length} 1s klines from Binance`);

      if (oneSecData.length > 0) {
        // Transform 1s klines data
        const candles = oneSecData.map(
          (item: any): TenSecondCandle => ({
            timestamp: item[0], // openTime
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
            tradeCount: item[8], // number of trades in this candle
          })
        );

        console.log(`Using ${candles.length} 1s candles for maximum precision`);
        return candles;
      }
    }

    // Try 3-second candles
    const threeSecondResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=3s&limit=1000`
    );

    if (threeSecondResponse.ok) {
      const threeSecData = await threeSecondResponse.json();
      console.log(`Received ${threeSecData.length} 3s klines from Binance`);

      if (threeSecData.length > 0) {
        // Transform 3s klines data
        const candles = threeSecData.map(
          (item: any): TenSecondCandle => ({
            timestamp: item[0], // openTime
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
            tradeCount: item[8], // number of trades in this candle
          })
        );

        console.log(`Using ${candles.length} 3s candles`);
        return candles;
      }
    }

    // Then try 5-second candles
    const fiveSecondResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5s&limit=1000`
    );

    if (fiveSecondResponse.ok) {
      const fiveSecData = await fiveSecondResponse.json();
      console.log(`Received ${fiveSecData.length} 5s klines from Binance`);

      if (fiveSecData.length > 0) {
        // Transform 5s klines data
        const candles = fiveSecData.map(
          (item: any): TenSecondCandle => ({
            timestamp: item[0], // openTime
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
            tradeCount: item[8], // number of trades in this candle
          })
        );

        console.log(`Using ${candles.length} 5s candles`);
        return candles;
      }
    }

    // If we can't get more granular data, try using aggTrades and build ultra-granular 1-second candles
    console.log("Trying aggTrades for ultra-granular data...");

    const aggTradesResponse = await fetch(
      `https://api.binance.com/api/v3/aggTrades?symbol=${symbol}&limit=1000`
    );

    if (aggTradesResponse.ok) {
      const aggTradesData: BinanceTrade[] = await aggTradesResponse.json();
      console.log(
        `Received ${aggTradesData.length} trades from Binance aggTrades`
      );

      if (aggTradesData.length > 0) {
        // Group trades into 1-second intervals for maximum granularity
        const oneSecondCandles: TenSecondCandle[] = [];
        let currentBucket: BinanceTrade[] = [];
        let currentBucketTimestamp = 0;

        // Sort trades by timestamp
        const sortedTrades = [...aggTradesData].sort((a, b) => a.T - b.T);

        for (const trade of sortedTrades) {
          // Calculate the 1-second bucket this trade belongs to (1000 milliseconds = 1 second)
          const bucketTimestamp = Math.floor(trade.T / 1000) * 1000;

          if (
            bucketTimestamp !== currentBucketTimestamp &&
            currentBucket.length > 0
          ) {
            // We've moved to a new 1-second interval, process the previous bucket
            const firstTrade = currentBucket[0];
            const lastTrade = currentBucket[currentBucket.length - 1];

            // Calculate OHLC values
            const open = parseFloat(firstTrade.p);
            const close = parseFloat(lastTrade.p);
            const high = Math.max(...currentBucket.map((t) => parseFloat(t.p)));
            const low = Math.min(...currentBucket.map((t) => parseFloat(t.p)));
            const volume = currentBucket.reduce(
              (sum, t) => sum + parseFloat(t.q),
              0
            );

            oneSecondCandles.push({
              timestamp: currentBucketTimestamp,
              open,
              high,
              low,
              close,
              volume,
              tradeCount: currentBucket.length,
            });

            // Start a new bucket
            currentBucket = [trade];
            currentBucketTimestamp = bucketTimestamp;
          } else {
            // Add to current bucket
            if (currentBucket.length === 0) {
              currentBucketTimestamp = bucketTimestamp;
            }
            currentBucket.push(trade);
          }
        }

        // Process the last bucket if it has trades
        if (currentBucket.length > 0) {
          const firstTrade = currentBucket[0];
          const lastTrade = currentBucket[currentBucket.length - 1];

          const open = parseFloat(firstTrade.p);
          const close = parseFloat(lastTrade.p);
          const high = Math.max(...currentBucket.map((t) => parseFloat(t.p)));
          const low = Math.min(...currentBucket.map((t) => parseFloat(t.p)));
          const volume = currentBucket.reduce(
            (sum, t) => sum + parseFloat(t.q),
            0
          );

          oneSecondCandles.push({
            timestamp: currentBucketTimestamp,
            open,
            high,
            low,
            close,
            volume,
            tradeCount: currentBucket.length,
          });
        }

        console.log(
          `Created ${oneSecondCandles.length} 1-second candles from aggTrades`
        );

        if (oneSecondCandles.length > 50) {
          return oneSecondCandles;
        }
      }
    }

    // Last resort: fall back to 1-minute klines
    console.log("Falling back to 1-minute klines");

    const oneMinuteResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000`
    );

    if (!oneMinuteResponse.ok) {
      throw new Error(`Binance klines API error: ${oneMinuteResponse.status}`);
    }

    const oneMinuteData = await oneMinuteResponse.json();
    console.log(
      `Received ${oneMinuteData.length} 1m klines from Binance fallback`
    );

    // Transform 1m klines data
    const candles = oneMinuteData.map(
      (item: any): TenSecondCandle => ({
        timestamp: item[0], // openTime
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        tradeCount: item[8], // number of trades in this candle
      })
    );

    return candles;
  } catch (error) {
    console.error("Error fetching Binance data:", error);

    // Final fallback
    try {
      console.log("Final fallback to 1m klines");
      const fallbackResponse = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000`
      );

      if (!fallbackResponse.ok) {
        throw new Error(`Binance klines API error: ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      console.log(
        `Received ${fallbackData.length} 1m klines in final fallback`
      );

      // Transform klines data
      const candles = fallbackData.map(
        (item: any): TenSecondCandle => ({
          timestamp: item[0], // openTime
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
          tradeCount: item[8], // number of trades in this candle
        })
      );

      return candles;
    } catch (fallbackError) {
      console.error("Error in fallback fetch:", fallbackError);
      return [];
    }
  }
}

export default function PriceComparisonChart() {
  // Add state for the selected feed
  const [selectedFeed, setSelectedFeed] = React.useState<FeedType>("ETH_USD");

  // Create chart options state based on selected feed
  const [chartOptions, setChartOptions] = React.useState<ChartOptionsWithZoom>(
    createChartOptions(selectedFeed)
  );

  // Update feed selection handler to properly handle changes and reset chart
  const handleFeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFeed = e.target.value as FeedType;
    console.log("Changing feed to:", newFeed); // Debug logging
    setSelectedFeed(newFeed);

    // Update chart options based on the new feed
    setChartOptions(createChartOptions(newFeed));

    // Apply feed-specific chart settings when feed changes
    if (chartRef.current) {
      const now = Date.now();
      const startTime = now - FEEDS[newFeed].defaultTimeWindow;

      // Update time settings
      chartRef.current.options.scales.x.min = startTime;
      chartRef.current.options.scales.x.max = now;
      chartRef.current.options.scales.x.time.unit = FEEDS[newFeed].timeUnit;
      chartRef.current.options.scales.x.time.displayFormats = {
        [FEEDS[newFeed].timeUnit]: FEEDS[newFeed].timeFormat,
      };
      chartRef.current.options.scales.x.ticks.maxTicksLimit =
        FEEDS[newFeed].maxTicksLimit;

      chartRef.current.update();
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["priceData", selectedFeed],
    queryFn: () => fetchPriceData(selectedFeed),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Add the stats expansion state here, with other state declarations
  const [isStatsExpanded, setIsStatsExpanded] = React.useState(false);
  const chartRef = React.useRef<any>(null);
  const [zoomMode, setZoomMode] = React.useState<"pan" | "zoom">("pan");

  // Add state for displaying Binance data
  const [showBinance, setShowBinance] = React.useState(true);

  // Query for Binance data
  const { data: binanceData, isLoading: isBinanceLoading } = useQuery({
    queryKey: ["binanceData", selectedFeed],
    queryFn: () => fetchBinanceData(FEEDS[selectedFeed].binanceSymbol),
    refetchInterval: 30000, // Refetch every 30 seconds to avoid rate limiting
    enabled: showBinance && selectedFeed !== "ETH_USD",
  });

  // Update the calculateStats function to include Binance comparison
  const calculateStats = (
    redstoneData: any[],
    chainlinkData: any[],
    binanceData: any[],
    hasBothOracles: boolean
  ) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const recent24hRedstone = hasBothOracles
      ? redstoneData.filter((d) => d.x >= twentyFourHoursAgo)
      : [];
    const recent24hChainlink = chainlinkData.filter(
      (d) => d.x >= twentyFourHoursAgo
    );
    const recent24hBinance = binanceData
      ? binanceData.filter((d) => d.x >= twentyFourHoursAgo)
      : [];

    // Calculate max deviations
    let maxRedstoneDeviation = 0;
    let maxChainlinkDeviation = 0;

    // Calculate Redstone max deviation between consecutive points
    if (hasBothOracles) {
      for (let i = 1; i < recent24hRedstone.length; i++) {
        const currentPrice = recent24hRedstone[i].y;
        const previousPrice = recent24hRedstone[i - 1].y;
        const deviation = Math.abs(
          ((currentPrice - previousPrice) / previousPrice) * 100
        );
        maxRedstoneDeviation = Math.max(maxRedstoneDeviation, deviation);
      }
    }

    // Calculate Chainlink max deviation between consecutive points
    for (let i = 1; i < recent24hChainlink.length; i++) {
      const currentPrice = recent24hChainlink[i].y;
      const previousPrice = recent24hChainlink[i - 1].y;
      const deviation = Math.abs(
        ((currentPrice - previousPrice) / previousPrice) * 100
      );
      maxChainlinkDeviation = Math.max(maxChainlinkDeviation, deviation);
    }

    // Calculate gas costs
    // Using the latest price as the ETH price in USD
    const latestRedstonePrice =
      hasBothOracles && recent24hRedstone.length > 0
        ? recent24hRedstone[0].y
        : recent24hChainlink.length > 0
        ? recent24hChainlink[0].y
        : 0;
    const latestChainlinkPrice =
      recent24hChainlink.length > 0 ? recent24hChainlink[0].y : 0;

    // Calculate total native token used (in wei)
    const totalRedstoneNativeToken = hasBothOracles
      ? recent24hRedstone.reduce(
          (sum, item) => sum + (item.nativeTokenUsed || 0),
          0
        )
      : 0;
    const totalChainlinkNativeToken = recent24hChainlink.reduce(
      (sum, item) => sum + (item.nativeTokenUsed || 0),
      0
    );

    // Convert wei to ETH (1 ETH = 10^18 wei)
    const weiToEth = 1e-18;

    const redstoneEthCost = totalRedstoneNativeToken * weiToEth;
    const chainlinkEthCost = totalChainlinkNativeToken * weiToEth;

    // Convert ETH cost to USD using the oracle's own price
    const redstoneUsdCost = redstoneEthCost * latestRedstonePrice;
    const chainlinkUsdCost = chainlinkEthCost * latestChainlinkPrice;

    // Calculate average cost per update
    const redstoneAvgCost =
      hasBothOracles && recent24hRedstone.length > 0
        ? redstoneUsdCost / recent24hRedstone.length
        : 0;
    const chainlinkAvgCost =
      recent24hChainlink.length > 0
        ? chainlinkUsdCost / recent24hChainlink.length
        : 0;

    // Find the most expensive update for each oracle
    let maxRedstoneUpdateCost = 0;
    let maxChainlinkUpdateCost = 0;

    // Calculate cost for each Redstone update and find the maximum
    if (hasBothOracles) {
      for (const update of recent24hRedstone) {
        if (update.nativeTokenUsed) {
          const ethCost = Number(update.nativeTokenUsed) * weiToEth;
          const usdCost = ethCost * latestRedstonePrice;
          maxRedstoneUpdateCost = Math.max(maxRedstoneUpdateCost, usdCost);
        }
      }
    }

    // Calculate cost for each Chainlink update and find the maximum
    for (const update of recent24hChainlink) {
      if (update.nativeTokenUsed) {
        const ethCost = Number(update.nativeTokenUsed) * weiToEth;
        const usdCost = ethCost * latestChainlinkPrice;
        maxChainlinkUpdateCost = Math.max(maxChainlinkUpdateCost, usdCost);
      }
    }

    // Calculate lag statistics when comparing to Binance
    let avgLagChainlink = 0;
    let maxLagChainlink = 0;
    let lagCount = 0;

    if (recent24hBinance.length > 0 && recent24hChainlink.length > 0) {
      // For each Chainlink update, find the closest Binance price
      for (const chainlinkPoint of recent24hChainlink) {
        // Find the closest Binance data point in time
        const closestBinance = recent24hBinance.reduce((closest, current) => {
          return Math.abs(current.x - chainlinkPoint.x) <
            Math.abs(closest.x - chainlinkPoint.x)
            ? current
            : closest;
        }, recent24hBinance[0]);

        // Calculate price difference as a percentage
        const priceDiff = Math.abs(
          ((chainlinkPoint.y - closestBinance.y) / closestBinance.y) * 100
        );

        // Calculate time difference in seconds
        const timeDiff = Math.abs(chainlinkPoint.x - closestBinance.x) / 1000;

        // Only count if the time difference is reasonable (less than 5 minutes)
        if (timeDiff < 300) {
          avgLagChainlink += timeDiff;
          maxLagChainlink = Math.max(maxLagChainlink, timeDiff);
          lagCount++;
        }
      }

      // Calculate average
      avgLagChainlink = lagCount > 0 ? avgLagChainlink / lagCount : 0;
    }

    return {
      redstone: {
        updates: recent24hRedstone.length,
        heartbeat: "24h",
        deviation: "0.5%",
        maxDeviation: maxRedstoneDeviation.toFixed(4) + "%",
        totalNativeTokenUsed: totalRedstoneNativeToken,
        totalCostUsd: redstoneUsdCost.toFixed(2),
        avgCostUsd: redstoneAvgCost.toFixed(2),
        maxUpdateCostUsd: maxRedstoneUpdateCost.toFixed(2),
      },
      chainlink: {
        updates: recent24hChainlink.length,
        heartbeat: "27s",
        deviation: "0.5%",
        maxDeviation: maxChainlinkDeviation.toFixed(4) + "%",
        totalNativeTokenUsed: totalChainlinkNativeToken,
        totalCostUsd: chainlinkUsdCost.toFixed(2),
        avgCostUsd: chainlinkAvgCost.toFixed(2),
        maxUpdateCostUsd: maxChainlinkUpdateCost.toFixed(2),
        // Add lag stats
        avgLagSeconds: avgLagChainlink.toFixed(1),
        maxLagSeconds: maxLagChainlink.toFixed(1),
      },
      binance: {
        updates: recent24hBinance.length,
      },
    };
  };

  // Add effect to set initial time view based on the selected feed
  React.useEffect(() => {
    if (chartRef.current && data) {
      const now = Date.now();
      const startTime = now - FEEDS[selectedFeed].defaultTimeWindow;

      // Update time settings
      chartRef.current.options.scales.x.min = startTime;
      chartRef.current.options.scales.x.max = now;
      chartRef.current.options.scales.x.time.unit =
        FEEDS[selectedFeed].timeUnit;
      chartRef.current.options.scales.x.time.displayFormats = {
        [FEEDS[selectedFeed].timeUnit]: FEEDS[selectedFeed].timeFormat,
      };
      chartRef.current.options.scales.x.ticks.maxTicksLimit =
        FEEDS[selectedFeed].maxTicksLimit;

      chartRef.current.update();
    }
  }, [data, selectedFeed]);

  // Update resetZoom function to use feed-specific time window
  const resetZoom = (period?: "default") => {
    if (chartRef.current) {
      const chart = chartRef.current;

      if (period === "default") {
        const now = Date.now();
        const startTime = now - FEEDS[selectedFeed].defaultTimeWindow;
        chart.options.scales.x.min = startTime;
        chart.options.scales.x.max = now;
        chart.options.plugins.zoom.limits = {};
      } else {
        chart.options.scales.x.min = undefined;
        chart.options.scales.x.max = undefined;
        chart.options.plugins.zoom.limits = {
          x: { min: "original" as const, max: "original" as const },
        };
      }

      chart.update();
    }
  };

  const toggleZoomMode = (mode: "pan" | "zoom") => {
    if (chartRef.current) {
      const chart = chartRef.current;

      if (mode === "zoom") {
        chart.options.plugins.zoom.zoom.drag.enabled = true;
        chart.options.plugins.zoom.pan.enabled = false;
      } else {
        chart.options.plugins.zoom.zoom.drag.enabled = false;
        chart.options.plugins.zoom.pan.enabled = true;
      }

      chart.update();
      setZoomMode(mode);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) {
    console.error("Query error:", error);
    return <div>Error loading data: {String(error)}</div>;
  }

  // Add more robust data validation and logging
  console.log("Data received:", data);

  // Update the data mapping with defensive checks
  const redstoneData =
    FEEDS[selectedFeed].hasRedstone &&
    data?.data &&
    Array.isArray(data.data.TransparentUpgradeableProxy_ValueUpdate)
      ? data.data.TransparentUpgradeableProxy_ValueUpdate.map(
          (item: PriceUpdate) => ({
            x: item.updatedAt * 1000,
            y: Number(item.value) / 1e8,
            nativeTokenUsed: item.nativeTokenUsed
              ? Number(item.nativeTokenUsed)
              : 0,
          })
        ).reverse()
      : [];

  const chainlinkData =
    data?.data &&
    Array.isArray(data.data.AccessControlledOCR2Aggregator_AnswerUpdated)
      ? data.data.AccessControlledOCR2Aggregator_AnswerUpdated.map(
          (item: PriceUpdate) => ({
            x: item.updatedAt * 1000,
            y: Number(item.current) / 1e8,
            nativeTokenUsed: item.nativeTokenUsed
              ? Number(item.nativeTokenUsed)
              : 0,
          })
        ).reverse()
      : [];

  // Transform Binance data for chart
  const binanceChartData =
    binanceData && binanceData.length > 0
      ? binanceData.map((item: TenSecondCandle) => {
          // Ensure timestamp is a number - JavaScript timestamps are in milliseconds
          // Some APIs might return timestamps as strings or seconds instead of milliseconds
          const timestamp =
            typeof item.timestamp === "string"
              ? parseInt(item.timestamp, 10)
              : item.timestamp;

          // Make sure we have a valid timestamp in milliseconds
          // If it's too small, it might be in seconds and need conversion
          const adjustedTimestamp =
            timestamp < 1000000000000 ? timestamp * 1000 : timestamp;

          return {
            x: adjustedTimestamp,
            y: item.close,
          };
        })
      : [];

  console.log(
    `Created ${binanceChartData.length} chart data points from Binance data`
  );
  if (binanceChartData.length > 0) {
    // Check the processed timestamps
    console.log("Binance chart data sample:", binanceChartData[0]);
    console.log(
      "First point time:",
      new Date(binanceChartData[0].x).toISOString()
    );
    console.log(
      "Last point time:",
      new Date(binanceChartData[binanceChartData.length - 1].x).toISOString()
    );

    // Add debug to compare with our chart time range
    console.log("Chart x-axis min:", chartOptions.scales?.x?.min);
    console.log("Chart x-axis max:", chartOptions.scales?.x?.max);
  }

  // Modify the chart data to include Binance dataset
  const chartData = {
    datasets: [
      ...(FEEDS[selectedFeed].hasRedstone
        ? [
            {
              label: "Redstone",
              data: redstoneData,
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.5)",
              pointRadius: 3,
            },
          ]
        : []),
      {
        label: "Chainlink",
        data: chainlinkData,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        pointRadius: 3,
      },
      ...(showBinance && selectedFeed !== "ETH_USD"
        ? [
            {
              label: "Binance",
              data: binanceChartData,
              borderColor: "rgb(75, 192, 192)",
              backgroundColor: "rgba(75, 192, 192, 0.5)",
              pointRadius: 0, // Hide points by default for smoother line
              borderWidth: 2,
              tension: 0.3, // Add tension for smooth curve
              pointHoverRadius: 4, // Larger hover radius to make points easier to hover
              pointHoverBorderWidth: 2,
              pointHoverBackgroundColor: "rgba(75, 192, 192, 0.8)",
              fill: false,
            },
          ]
        : []),
    ],
  };

  return (
    <div className="w-full mx-auto px-2">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3">
        {/* Add Feed Selector Dropdown with updated handler */}
        <div className="w-full sm:w-auto mb-2 sm:mb-0">
          <select
            value={selectedFeed}
            onChange={handleFeedChange}
            className="px-2 py-1 text-xs sm:text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200 shadow-sm cursor-pointer w-full"
          >
            <option value="ETH_USD">ETH/USD</option>
            <option value="BTC_USD">BTC/USD (Polygon)</option>
          </select>
        </div>

        {/* Add Binance toggle */}
        {selectedFeed !== "ETH_USD" && (
          <div className="w-full sm:w-auto mb-2 sm:mb-0 flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showBinance}
                onChange={() => setShowBinance(!showBinance)}
                className="sr-only peer"
              />
              <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-[rgb(75,192,192)]"></div>
              <span className="ml-1.5 text-xs text-gray-700 dark:text-gray-300">
                Binance
              </span>
            </label>
          </div>
        )}

        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => toggleZoomMode("pan")}
            className={`flex-1 sm:flex-none px-2 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 shadow-sm ${
              zoomMode === "pan"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
            }`}
          >
            Pan Mode
          </button>
          <button
            onClick={() => toggleZoomMode("zoom")}
            className={`flex-1 sm:flex-none px-2 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 shadow-sm ${
              zoomMode === "zoom"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
            }`}
          >
            Box Zoom
          </button>
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => resetZoom("default")}
            className="flex-1 sm:flex-none px-2 py-1 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-all duration-200 shadow-sm hover:scale-105"
          >
            {selectedFeed === "ETH_USD" ? "Last 24h" : "Last 3h"}
          </button>
          <button
            onClick={() => resetZoom()}
            className="flex-1 sm:flex-none px-2 py-1 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-all duration-200 shadow-sm hover:scale-105"
          >
            All Data
          </button>
        </div>
      </div>
      <div className="h-[45vh] sm:h-[55vh] relative">
        <Line
          ref={chartRef}
          options={chartOptions}
          data={chartData}
          className="backdrop-blur-sm"
        />
      </div>
      <div className="mt-2 sm:mt-3 text-xs text-muted-foreground/80 text-center space-y-1">
        <div className="font-medium">Data updates every 30 seconds</div>
        <div className="text-xs space-y-1 opacity-75">
          <p>Pan Mode: Click and drag to move the chart</p>
          <p>Box Zoom: Click and drag to zoom into an area</p>
          <p className="hidden sm:block">
            Quick Zoom: Hold Ctrl + Mouse wheel to zoom
          </p>
        </div>
      </div>

      {/* Stats box */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden w-80 sm:w-96">
        <button
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          className="w-full px-4 py-2 border-b bg-muted/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h3 className="text-xs font-medium text-foreground/90">
            {FEEDS[selectedFeed].name} Oracle Statistics (last 24h)
          </h3>
          <div
            className={`transform transition-transform duration-200 ${
              isStatsExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </div>
        </button>

        {/* Compact View */}
        {!isStatsExpanded && (
          <div className="p-2 grid grid-cols-2 gap-3 text-xs">
            {FEEDS[selectedFeed].hasRedstone && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[rgb(255,99,132)]" />
                <span className="font-medium">
                  {
                    calculateStats(
                      redstoneData,
                      chainlinkData,
                      binanceChartData,
                      FEEDS[selectedFeed].hasRedstone
                    ).redstone.updates
                  }{" "}
                  updates
                </span>
              </div>
            )}
            <div
              className={`flex items-center gap-1.5 ${
                !FEEDS[selectedFeed].hasRedstone ? "col-span-2" : ""
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(53,162,235)]" />
              <span className="font-medium">
                {
                  calculateStats(
                    redstoneData,
                    chainlinkData,
                    binanceChartData,
                    FEEDS[selectedFeed].hasRedstone
                  ).chainlink.updates
                }{" "}
                updates
              </span>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isStatsExpanded && (
          <div className="p-4 space-y-4">
            <div
              className={`grid ${
                FEEDS[selectedFeed].hasRedstone ? "grid-cols-2" : "grid-cols-1"
              } gap-6`}
            >
              {/* Redstone Stats - Only show if available for the selected feed */}
              {FEEDS[selectedFeed].hasRedstone && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[rgb(255,99,132)]" />
                      <h4 className="text-sm font-medium">Redstone</h4>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 group relative">
                      <span>(±0.5%, 24h)</span>
                      <div className="h-3.5 w-3.5 rounded-full border flex items-center justify-center text-[10px] cursor-help">
                        i
                      </div>
                      <div className="absolute invisible group-hover:visible bg-black/80 text-xs text-white p-2 rounded-md -top-[4.5rem] left-0 w-48 backdrop-blur-sm z-20">
                        Updates occur when either:
                        <br />• 24 hours have passed
                        <br />• Price changes by ±0.5%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Updates:</span>
                      <span className="font-medium">
                        {
                          calculateStats(
                            redstoneData,
                            chainlinkData,
                            binanceChartData,
                            FEEDS[selectedFeed].hasRedstone
                          ).redstone.updates
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Max Deviation:
                      </span>
                      <span className="font-medium">
                        {
                          calculateStats(
                            redstoneData,
                            chainlinkData,
                            binanceChartData,
                            FEEDS[selectedFeed].hasRedstone
                          ).redstone.maxDeviation
                        }
                      </span>
                    </div>

                    {/* Cost metrics with extra spacing */}
                    <div className="pt-3 border-t mt-3">
                      <div className="flex justify-between text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            Total Cost (24h):
                          </span>
                          <span className="text-[9px] text-muted-foreground/70">
                            on-chain updates
                          </span>
                        </div>
                        <span className="font-medium">
                          $
                          {
                            calculateStats(
                              redstoneData,
                              chainlinkData,
                              binanceChartData,
                              FEEDS[selectedFeed].hasRedstone
                            ).redstone.totalCostUsd
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">
                          Avg Cost/Update:
                        </span>
                        <span className="text-[9px] text-muted-foreground/70">
                          per on-chain tx
                        </span>
                      </div>
                      <span className="font-medium">
                        $
                        {
                          calculateStats(
                            redstoneData,
                            chainlinkData,
                            binanceChartData,
                            FEEDS[selectedFeed].hasRedstone
                          ).redstone.avgCostUsd
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">
                          Most Expensive:
                        </span>
                        <span className="text-[9px] text-muted-foreground/70">
                          single update
                        </span>
                      </div>
                      <span className="font-medium">
                        $
                        {
                          calculateStats(
                            redstoneData,
                            chainlinkData,
                            binanceChartData,
                            FEEDS[selectedFeed].hasRedstone
                          ).redstone.maxUpdateCostUsd
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chainlink Stats with Binance comparison */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[rgb(53,162,235)]" />
                    <h4 className="text-sm font-medium">Chainlink</h4>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 group relative">
                    <span>(±0.5%, 24h)</span>
                    <div className="h-3.5 w-3.5 rounded-full border flex items-center justify-center text-[10px] cursor-help">
                      i
                    </div>
                    <div className="absolute invisible group-hover:visible bg-black/80 text-xs text-white p-2 rounded-md -top-[4.5rem] right-0 w-48 backdrop-blur-sm z-20">
                      Updates occur when either:
                      <br />• 24 hours have passed
                      <br />• Price changes by ±0.5%
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Updates:</span>
                    <span className="font-medium">
                      {
                        calculateStats(
                          redstoneData,
                          chainlinkData,
                          binanceChartData,
                          FEEDS[selectedFeed].hasRedstone
                        ).chainlink.updates
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Max Deviation:
                    </span>
                    <span className="font-medium">
                      {
                        calculateStats(
                          redstoneData,
                          chainlinkData,
                          binanceChartData,
                          FEEDS[selectedFeed].hasRedstone
                        ).chainlink.maxDeviation
                      }
                    </span>
                  </div>

                  {/* Cost metrics with extra spacing */}
                  <div className="pt-3 border-t mt-3">
                    <div className="flex justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">
                          Total Cost (24h):
                        </span>
                        <span className="text-[9px] text-muted-foreground/70">
                          on-chain updates
                        </span>
                      </div>
                      <span className="font-medium">
                        $
                        {
                          calculateStats(
                            redstoneData,
                            chainlinkData,
                            binanceChartData,
                            FEEDS[selectedFeed].hasRedstone
                          ).chainlink.totalCostUsd
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        Avg Cost/Update:
                      </span>
                      <span className="text-[9px] text-muted-foreground/70">
                        per on-chain tx
                      </span>
                    </div>
                    <span className="font-medium">
                      $
                      {
                        calculateStats(
                          redstoneData,
                          chainlinkData,
                          binanceChartData,
                          FEEDS[selectedFeed].hasRedstone
                        ).chainlink.avgCostUsd
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        Most Expensive:
                      </span>
                      <span className="text-[9px] text-muted-foreground/70">
                        single update
                      </span>
                    </div>
                    <span className="font-medium">
                      $
                      {
                        calculateStats(
                          redstoneData,
                          chainlinkData,
                          binanceChartData,
                          FEEDS[selectedFeed].hasRedstone
                        ).chainlink.maxUpdateCostUsd
                      }
                    </span>
                  </div>

                  {/* Add Binance comparison stats when Binance is enabled */}
                  {showBinance && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Avg Lag vs Binance:
                        </span>
                        <span className="font-medium">
                          {
                            calculateStats(
                              redstoneData,
                              chainlinkData,
                              binanceChartData,
                              FEEDS[selectedFeed].hasRedstone
                            ).chainlink.avgLagSeconds
                          }
                          s
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Max Lag vs Binance:
                        </span>
                        <span className="font-medium">
                          {
                            calculateStats(
                              redstoneData,
                              chainlinkData,
                              binanceChartData,
                              FEEDS[selectedFeed].hasRedstone
                            ).chainlink.maxLagSeconds
                          }
                          s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground/70 text-center pt-1 border-t">
              Cost calculations based on actual on-chain gas consumption and
              current ETH price
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
