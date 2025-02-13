"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PriceComparisonChart from "@/components/PriceComparisonChart";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-8">
        <main className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Redstone vs Chainlink: ETH/USD Price Comparison
          </h1>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <PriceComparisonChart />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
