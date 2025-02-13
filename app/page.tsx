"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PriceComparisonChart from "@/components/PriceComparisonChart";
import { ChevronDown } from "lucide-react";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-8">
        <main className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Oracle Wars
            </h1>
            <div className="flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-card border shadow-sm hover:shadow-md transition-all duration-200 cursor-not-allowed"
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
          <div className="bg-card p-8 rounded-xl shadow-xl border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 hover:shadow-2xl transition-all duration-500">
            <PriceComparisonChart />
            <div className="absolute bottom-3 right-4 text-xs text-muted-foreground/80 text-right">
              <div className="space-x-1">
                <span>Data source:</span>
                <a
                  href="https://envio.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary hover:underline transition-colors"
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
