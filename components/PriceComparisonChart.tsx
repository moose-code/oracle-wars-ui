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
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import React from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

const options = {
  responsive: true,
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: "top" as const,
    },
    tooltip: {
      callbacks: {
        title: (context: any) => {
          return format(new Date(context[0].parsed.x), "MMM d, yyyy HH:mm:ss");
        },
      },
    },
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
          modifierKey: "ctrl",
        },
        pinch: {
          enabled: true,
        },
        mode: "x",
        drag: {
          enabled: false,
        },
      },
      pan: {
        enabled: true,
        mode: "x",
      },
      limits: {
        y: { min: 0 },
      },
    },
  },
  scales: {
    x: {
      type: "time" as const,
      time: {
        unit: "minute",
        displayFormats: {
          minute: "EEE, MMM d, yyyy HH:mm:ss",
        },
      },
      title: {
        display: true,
        text: "Time",
      },
    },
    y: {
      type: "linear" as const,
      display: true,
      position: "left" as const,
      title: {
        display: true,
        text: "Price (USD)",
      },
    },
  },
};

async function fetchPriceData() {
  const response = await fetch("http://localhost:8080/v1/graphql", {
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
  });

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
      } else {
        chart.options.scales.x.min = undefined;
        chart.options.scales.x.max = undefined;
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

  const redstoneData = data.data.TransparentUpgradeableProxy_ValueUpdate.map(
    (item: any) => ({
      x: item.updatedAt * 1000, // Convert to milliseconds for Chart.js
      y: Number(item.value) / 1e8,
    })
  ).reverse();

  const chainlinkData =
    data.data.AccessControlledOCR2Aggregator_AnswerUpdated.map((item: any) => ({
      x: item.updatedAt * 1000, // Convert to milliseconds for Chart.js
      y: Number(item.current) / 1e8,
    })).reverse();

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
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button
            onClick={() => toggleZoomMode("pan")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              zoomMode === "pan"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Pan Mode
          </button>
          <button
            onClick={() => toggleZoomMode("zoom")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              zoomMode === "zoom"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Box Zoom
          </button>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => resetZoom("24h")}
            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Last 24h
          </button>
          <button
            onClick={() => resetZoom()}
            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            All Data
          </button>
        </div>
      </div>
      <Line ref={chartRef} options={options} data={chartData} />
      <div className="mt-4 text-sm text-muted-foreground text-center space-y-1">
        <div>Data updates every 30 seconds</div>
        <div className="text-xs space-y-1">
          <p>Pan Mode: Click and drag to move the chart</p>
          <p>Box Zoom: Click and drag to zoom into an area</p>
          <p>Quick Zoom: Hold Ctrl + Mouse wheel to zoom</p>
        </div>
      </div>
    </div>
  );
}
