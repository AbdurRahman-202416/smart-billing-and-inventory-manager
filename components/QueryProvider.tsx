"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, useEffect } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 60, // 1 hour caching
        gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPersister(
        createSyncStoragePersister({
          storage: window.localStorage,
          key: "SMART_MANAGER_QUERY_CACHE_V1",
        })
      );
    }
  }, []);

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
