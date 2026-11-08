import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedId, officialSources } from "./catalog";
import { currentOfficialItems, loadOfficialFeed } from "./adapters";
export function useOfficialFeeds() {
  const client = useQueryClient();
  const selection = useQuery<FeedId[]>({
    queryKey: ["official-layer-selection"],
    queryFn: async () => [],
    initialData: [],
    staleTime: Infinity,
  });
  const selected = selection.data;
  const weather = useQuery({
    queryKey: ["official", "weather"],
    queryFn: ({ signal }) => loadOfficialFeed("weather", signal),
    enabled:
      !!officialSources.weather.validatedAt && selected.includes("weather"),
    staleTime: 300000,
    refetchInterval: 300000,
    retry: 1,
  });
  const earthquakes = useQuery({
    queryKey: ["official", "earthquakes"],
    queryFn: ({ signal }) => loadOfficialFeed("earthquakes", signal),
    enabled:
      !!officialSources.earthquakes.validatedAt &&
      selected.includes("earthquakes"),
    staleTime: 300000,
    refetchInterval: 300000,
    retry: 1,
  });
  return {
    selected,
    queries: { weather, earthquakes },
    items: [
      ...(selected.includes("weather")
        ? currentOfficialItems(weather.data)
        : []),
      ...(selected.includes("earthquakes")
        ? currentOfficialItems(earthquakes.data)
        : []),
    ],
    toggle(id: FeedId) {
      if (!officialSources[id].validatedAt) return;
      client.setQueryData<FeedId[]>(["official-layer-selection"], (previous) =>
        (previous ?? []).includes(id)
          ? (previous ?? []).filter((key) => key !== id)
          : [...(previous ?? []), id],
      );
    },
  };
}
