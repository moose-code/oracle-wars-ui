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
    ctx.globalAlpha = 0.05; // Very subtle transparency
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "36px Arial"; // Slightly smaller font to fit better at the top
    ctx.fillStyle = "rgb(100, 100, 100)";
    ctx.fillText("Oracle Wars", x, y);
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
      min: Date.now() - 24 * 60 * 60 * 1000,
      max: Date.now(),
      time: {
        unit: "hour",
        displayFormats: {
          hour: "MMM d, HH:mm",
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
        maxTicksLimit: 8,
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

async function fetchPriceData() {
  const response = await fetch(
    "https://indexer.dev.hyperindex.xyz/136b503/v1/graphql",
    {
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
          }
          AccessControlledOCR2Aggregator_AnswerUpdated(limit: 1000, order_by: {updatedAt: desc}) {
            id
            updatedAt
            current
          }
        }
      `,
      }),
    }
  );

  return response.json();
}

export default function PriceComparisonChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["priceData"],
    queryFn: fetchPriceData,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const chartRef = React.useRef<any>(null);
  const [zoomMode, setZoomMode] = React.useState<"pan" | "zoom">("pan");

  // Add effect to set initial 24h view
  React.useEffect(() => {
    if (chartRef.current && data) {
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
      chartRef.current.options.scales.x.min = twentyFourHoursAgo;
      chartRef.current.options.scales.x.max = now;
      chartRef.current.update();
    }
  }, [data]);

  const resetZoom = (period?: "24h") => {
    if (chartRef.current) {
      const chart = chartRef.current;

      if (period === "24h") {
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
        chart.options.scales.x.min = twentyFourHoursAgo;
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
  if (error) return <div>Error loading data</div>;

  // Update the data mapping
  const redstoneData = data.data.TransparentUpgradeableProxy_ValueUpdate.map(
    (item: PriceUpdate) => ({
      x: item.updatedAt * 1000,
      y: Number(item.value) / 1e8,
    })
  ).reverse();

  const chainlinkData =
    data.data.AccessControlledOCR2Aggregator_AnswerUpdated.map(
      (item: PriceUpdate) => ({
        x: item.updatedAt * 1000,
        y: Number(item.current) / 1e8,
      })
    ).reverse();

  const chartData = {
    datasets: [
      {
        label: "Redstone",
        data: redstoneData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        pointRadius: 3,
      },
      {
        label: "Chainlink",
        data: chainlinkData,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        pointRadius: 3,
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
      <div className="h-[45vh] sm:h-[55vh]">
        <Line
          ref={chartRef}
          options={options}
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
    </div>
  );
}
