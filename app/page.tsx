"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PriceComparisonChart from "@/components/PriceComparisonChart";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-8">
        <main className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col items-center relative">
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-primary rounded-lg transform rotate-45"></div>
                <div className="absolute inset-[3px] bg-background rounded-lg transform rotate-45 flex items-center justify-center">
                  <div className="transform -rotate-45 text-lg font-bold text-primary">
                    O
                  </div>
                </div>
              </div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Oracle Wars
              </h1>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-card border shadow-sm hover:shadow-md transition-all duration-200 cursor-not-allowed"
                disabled
              >
                <span className="font-medium">ETH/USD (Ethereum)</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground">
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
