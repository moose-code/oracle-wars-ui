"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PriceComparisonChart from "@/components/PriceComparisonChart";
import { ChevronDown } from "lucide-react";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-8">
        <main className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Oracle Wars</h1>
            <div className="flex items-center justify-center gap-1.5">
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors cursor-not-allowed"
                disabled
              >
                <span className="font-medium">ETH/USD (Ethereum)</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              <span className="text-sm text-muted-foreground">
                More pairs coming soon
              </span>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg border relative">
            <PriceComparisonChart />
            <div className="absolute bottom-2 right-4 text-xs text-muted-foreground text-right">
              <div className="space-x-1">
                <span>Data source:</span>
                <a
                  href="https://envio.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  indexed by Envio
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
