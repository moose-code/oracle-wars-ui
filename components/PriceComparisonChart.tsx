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
  logIndex?: number;
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

// Create a custom plugin to disable animations consistently
const noAnimationPlugin = {
  id: "noAnimation",
  afterInit: (chart: any) => {
    // Add a hook to disable animations during updates
    const originalUpdate = chart.update;
    chart.update = function (mode?: any) {
      // Disable animations temporarily during update
      const prevAnimationSetting = chart.options.animation;
      chart.options.animation = false;
      originalUpdate.call(this, mode);
      // Restore original animation setting
      chart.options.animation = prevAnimationSetting;
    };
  },
  // Add a hook to prevent animations during resize/zooming
  beforeUpdate: (chart: any) => {
    if (chart.animating) {
      chart.animating = false;
    }
  },
};

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
        plugin,
        noAnimationPlugin
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

const options: ChartOptionsWithZoom = {
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
      min: Date.now() - 60 * 1000,
      max: Date.now(),
      time: {
        unit: "second",
        displayFormats: {
          second: "HH:mm:ss",
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
        maxTicksLimit: 10,
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

// Phase 1.1: Utility function to extract log index from ID
function extractLogIndexFromId(id: string): number {
  // ID format: ${chainId}_${blockNumber}_${logIndex}
  const parts = id.split("_");
  if (parts.length >= 3) {
    const logIndex = parseInt(parts[2], 10);
    return isNaN(logIndex) ? 0 : logIndex;
  }
  return 0;
}

// Phase 1.2: Function to distribute timestamps based on log index
function distributeTimestamps(
  data: Array<{ id: string; updatedAt: number; [key: string]: any }>
): Array<{
  id: string;
  updatedAt: number;
  logIndex: number;
  adjustedTimestamp: number;
  [key: string]: any;
}> {
  // Group data by timestamp
  const groupedByTimestamp = new Map<
    number,
    Array<{
      id: string;
      updatedAt: number;
      logIndex: number;
      [key: string]: any;
    }>
  >();

  // Extract log index and group by timestamp
  const dataWithLogIndex = data.map((item) => ({
    ...item,
    logIndex: extractLogIndexFromId(item.id),
  }));

  dataWithLogIndex.forEach((item) => {
    const timestamp = item.updatedAt;
    if (!groupedByTimestamp.has(timestamp)) {
      groupedByTimestamp.set(timestamp, []);
    }
    groupedByTimestamp.get(timestamp)!.push(item);
  });

  // Distribute timestamps within each group
  const distributedData: Array<{
    id: string;
    updatedAt: number;
    logIndex: number;
    adjustedTimestamp: number;
    [key: string]: any;
  }> = [];

  groupedByTimestamp.forEach((group, originalTimestamp) => {
    if (group.length === 1) {
      // Single item, no need to distribute
      distributedData.push({
        ...group[0],
        adjustedTimestamp: originalTimestamp * 1000, // Convert to milliseconds
      });
    } else {
      // Multiple items, distribute across the second based on log index
      // Sort by log index to ensure chronological ordering
      group.sort((a, b) => a.logIndex - b.logIndex);

      const maxLogIndex = Math.max(...group.map((item) => item.logIndex));
      const minLogIndex = Math.min(...group.map((item) => item.logIndex));
      const logIndexRange = maxLogIndex - minLogIndex;

      group.forEach((item, index) => {
        let adjustedTimestamp: number;

        if (logIndexRange === 0) {
          // All items have the same log index, distribute evenly
          adjustedTimestamp =
            originalTimestamp * 1000 + (index / group.length) * 1000;
        } else {
          // Distribute based on log index position within the range
          const relativePosition =
            (item.logIndex - minLogIndex) / logIndexRange;
          adjustedTimestamp =
            originalTimestamp * 1000 + relativePosition * 1000;
        }

        distributedData.push({
          ...item,
          adjustedTimestamp,
        });
      });
    }
  });

  return distributedData;
}

async function fetchPriceData() {
  // Function to fetch a single page of data
  async function fetchPage(offset: number) {
    const response = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query myQuery {
            TransparentUpgradeableProxy_ValueUpdate(
              limit: 1000, 
              offset: ${offset}, 
              order_by: {updatedAt: desc}
            ) {
              id
              updatedAt
              value
              nativeTokenUsed
            }
            AccessControlledOCR2Aggregator_AnswerUpdated(
              limit: 1000, 
              offset: ${offset}, 
              order_by: {updatedAt: desc}
            ) {
              id
              updatedAt
              current
              nativeTokenUsed
            }
          }
        `,
      }),
    });

    return response.json();
  }

  try {
    // Fetch first 3 pages in parallel (3000 items total)
    const [page1, page2, page3] = await Promise.all([
      fetchPage(0),
      fetchPage(1000),
      fetchPage(2000),
    ]);

    // Combine the results
    return {
      data: {
        TransparentUpgradeableProxy_ValueUpdate: [
          ...page1.data.TransparentUpgradeableProxy_ValueUpdate,
          ...page2.data.TransparentUpgradeableProxy_ValueUpdate,
          ...page3.data.TransparentUpgradeableProxy_ValueUpdate,
        ],
        AccessControlledOCR2Aggregator_AnswerUpdated: [
          ...page1.data.AccessControlledOCR2Aggregator_AnswerUpdated,
          ...page2.data.AccessControlledOCR2Aggregator_AnswerUpdated,
          ...page3.data.AccessControlledOCR2Aggregator_AnswerUpdated,
        ],
      },
    };
  } catch (error) {
    console.error("Error fetching paginated data:", error);
    // If pagination fails, fall back to a single query
    const response = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query myQuery {
            TransparentUpgradeableProxy_ValueUpdate(limit: 1000, order_by: {updatedAt: desc}) {
              id
              updatedAt
              value
              nativeTokenUsed
            }
            AccessControlledOCR2Aggregator_AnswerUpdated(limit: 1000, order_by: {updatedAt: desc}) {
              id
              updatedAt
              current
              nativeTokenUsed
            }
          }
        `,
      }),
    });

    return response.json();
  }
}

export default function PriceComparisonChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["priceData"],
    queryFn: fetchPriceData,
    refetchInterval: 1000,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Add state to track the latest price and animate it
  const [latestPrice, setLatestPrice] = React.useState<number | null>(null);
  const [priceChanged, setPriceChanged] = React.useState(false);
  const [previousPrice, setPreviousPrice] = React.useState<number | null>(null);

  // Add a separate effect to update chart when data changes
  React.useEffect(() => {
    if (chartRef.current && data) {
      // Remove the 'none' parameter to allow normal chart updates
      chartRef.current.update();

      // Get latest price data
      const redstoneUpdates = data.data.TransparentUpgradeableProxy_ValueUpdate;
      if (redstoneUpdates && redstoneUpdates.length > 0) {
        const newPrice = Number(redstoneUpdates[0].value) / 1e8;

        // Only trigger animation when price actually changes
        if (newPrice !== latestPrice) {
          setPreviousPrice(latestPrice);
          setLatestPrice(newPrice);
          setPriceChanged(true);

          // Reset animation after a short delay
          setTimeout(() => {
            setPriceChanged(false);
          }, 2000);
        }
      }
    }
  }, [data, latestPrice]);

  const [isStatsExpanded, setIsStatsExpanded] = React.useState(false);
  const chartRef = React.useRef<any>(null);
  const [zoomMode, setZoomMode] = React.useState<"pan" | "zoom">("pan");

  // Set initial timeframe
  React.useEffect(() => {
    if (chartRef.current && data) {
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;

      // Set the time window
      chartRef.current.options.scales.x.min = oneMinuteAgo;
      chartRef.current.options.scales.x.max = now;

      chartRef.current.update();
    }
  }, [data]);

  const calculateStats = (redstoneData: any[], chainlinkData: any[]) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const recent24hRedstone = redstoneData.filter(
      (d) => d.x >= twentyFourHoursAgo
    );
    const recent24hChainlink = chainlinkData.filter(
      (d) => d.x >= twentyFourHoursAgo
    );

    // Calculate max deviations
    let maxRedstoneDeviation = 0;
    let maxChainlinkDeviation = 0;

    // Calculate Redstone max deviation between consecutive points
    for (let i = 1; i < recent24hRedstone.length; i++) {
      const currentPrice = recent24hRedstone[i].y;
      const previousPrice = recent24hRedstone[i - 1].y;
      const deviation = Math.abs(
        ((currentPrice - previousPrice) / previousPrice) * 100
      );
      maxRedstoneDeviation = Math.max(maxRedstoneDeviation, deviation);
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
      recent24hRedstone.length > 0 ? recent24hRedstone[0].y : 0;
    const latestChainlinkPrice =
      recent24hChainlink.length > 0 ? recent24hChainlink[0].y : 0;

    // Calculate total native token used (in wei)
    const totalRedstoneNativeToken = recent24hRedstone.reduce(
      (sum, item) => sum + (item.nativeTokenUsed || 0),
      0
    );
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
      recent24hRedstone.length > 0
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
    for (const update of recent24hRedstone) {
      if (update.nativeTokenUsed) {
        const ethCost = Number(update.nativeTokenUsed) * weiToEth;
        const usdCost = ethCost * latestRedstonePrice;
        maxRedstoneUpdateCost = Math.max(maxRedstoneUpdateCost, usdCost);
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
      },
    };
  };

  const resetZoom = (period?: "24h" | "1h" | "1m") => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const now = Date.now();

      if (period === "24h") {
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
        chart.options.scales.x.min = twentyFourHoursAgo;
        chart.options.scales.x.max = now;
        chart.options.plugins.zoom.limits = {};
      } else if (period === "1h") {
        const oneHourAgo = now - 60 * 60 * 1000;
        chart.options.scales.x.min = oneHourAgo;
        chart.options.scales.x.max = now;
        chart.options.plugins.zoom.limits = {};
      } else if (period === "1m") {
        const oneMinuteAgo = now - 60 * 1000;
        chart.options.scales.x.min = oneMinuteAgo;
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

  // Calculate price change percentage
  const calculatePriceChange = () => {
    if (!previousPrice || !latestPrice) return null;
    const pctChange = ((latestPrice - previousPrice) / previousPrice) * 100;
    return {
      value: pctChange.toFixed(4),
      isPositive: pctChange >= 0,
    };
  };

  const priceChange = calculatePriceChange();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  // Phase 1.2: Apply timestamp distribution to both datasets
  const distributedRedstoneData = distributeTimestamps(
    data.data.TransparentUpgradeableProxy_ValueUpdate
  );

  const distributedChainlinkData = distributeTimestamps(
    data.data.AccessControlledOCR2Aggregator_AnswerUpdated
  );

  // Option 1: Global chronological sorting after distribution
  const redstoneData = distributedRedstoneData
    .map((item: any) => ({
      x: item.adjustedTimestamp, // Use adjusted timestamp instead of original
      y: Number(item.value) / 1e8,
      nativeTokenUsed: item.nativeTokenUsed ? Number(item.nativeTokenUsed) : 0,
      logIndex: item.logIndex, // Include log index for reference
    }))
    .sort((a, b) => a.x - b.x); // Global chronological sort by adjustedTimestamp

  const chainlinkData = distributedChainlinkData
    .map((item: any) => ({
      x: item.adjustedTimestamp, // Use adjusted timestamp instead of original
      y: Number(item.current) / 1e8,
      nativeTokenUsed: item.nativeTokenUsed ? Number(item.nativeTokenUsed) : 0,
      logIndex: item.logIndex, // Include log index for reference
    }))
    .sort((a, b) => a.x - b.x); // Global chronological sort by adjustedTimestamp

  const chartData = {
    datasets: [
      {
        label: "Redstone",
        data: redstoneData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 1.5,
        tension: 0.1, // Add slight smoothing to reduce jagged appearance
        pointBackgroundColor: "rgb(255, 99, 132)",
        pointBorderColor: "rgba(255, 255, 255, 0.8)",
        pointBorderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3">
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
            onClick={() => resetZoom("1m")}
            className="flex-1 sm:flex-none px-2 py-1 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-all duration-200 shadow-sm hover:scale-105"
          >
            Last Minute
          </button>
          <button
            onClick={() => resetZoom("1h")}
            className="flex-1 sm:flex-none px-2 py-1 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-all duration-200 shadow-sm hover:scale-105"
          >
            Last Hour
          </button>
          <button
            onClick={() => resetZoom("24h")}
            className="flex-1 sm:flex-none px-2 py-1 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-all duration-200 shadow-sm hover:scale-105"
          >
            Last 24h
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
          options={options}
          data={chartData}
          className="backdrop-blur-sm"
        />
      </div>

      {/* Price update animation */}
      <div className="mt-4 flex justify-center">
        <div className="relative bg-card/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg w-full max-w-md">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">
              Current ETH/USD Price
            </div>
            <div className="flex items-center justify-center gap-3">
              <div
                className={`text-2xl font-bold transition-all duration-300 ${
                  priceChanged ? "scale-110 text-primary" : ""
                }`}
              >
                $
                {latestPrice?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "---"}
              </div>

              {priceChange && (
                <div
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    priceChanged ? "animate-pulse" : ""
                  } ${
                    priceChange.isPositive
                      ? "text-green-500 bg-green-500/10"
                      : "text-red-500 bg-red-500/10"
                  }`}
                >
                  {priceChange.isPositive ? "+" : ""}
                  {priceChange.value}%
                </div>
              )}
            </div>
          </div>

          {/* Pulsing dots animation to indicate real-time updates */}
          <div className="flex justify-center mt-2 gap-1">
            <div className="text-xs text-muted-foreground/70">
              Real-time updates
            </div>
            <div className="flex gap-1 items-center">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  priceChanged ? "bg-primary" : "bg-muted"
                } 
                ${priceChanged ? "animate-pulse" : ""}`}
              ></div>
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  priceChanged ? "bg-primary" : "bg-muted"
                } 
                ${priceChanged ? "animate-pulse delay-100" : ""}`}
              ></div>
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  priceChanged ? "bg-primary" : "bg-muted"
                } 
                ${priceChanged ? "animate-pulse delay-200" : ""}`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 sm:mt-3 text-xs text-muted-foreground/80 text-center space-y-1">
        <div className="font-medium">Data updates every second</div>
        <div className="text-xs space-y-1 opacity-75">
          <p>Pan Mode: Click and drag to move the chart</p>
          <p>Box Zoom: Click and drag to zoom into an area</p>
          <p className="hidden sm:block">
            Quick Zoom: Hold Ctrl + Mouse wheel to zoom
          </p>
        </div>
      </div>
    </div>
  );
}
