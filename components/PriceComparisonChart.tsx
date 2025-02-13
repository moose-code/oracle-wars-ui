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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
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
  },
  scales: {
    x: {
      type: "time" as const,
      time: {
        unit: "minute",
        displayFormats: {
          minute: "HH:mm:ss",
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
          TransparentUpgradeableProxy_ValueUpdate(limit: 100, order_by: {updatedAt: desc}) {
            id
            updatedAt
            value
          }
          AccessControlledOCR2Aggregator_AnswerUpdated(limit: 100, order_by: {updatedAt: desc}) {
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
      <Line options={options} data={chartData} />
      <div className="mt-4 text-sm text-muted-foreground text-center">
        Data updates every 30 seconds
      </div>
    </div>
  );
}
