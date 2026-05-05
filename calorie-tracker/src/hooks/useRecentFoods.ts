import { useQuery } from "@tanstack/react-query";

type RecentFood = { name: string; calories: number };

export function useRecentFoods() {
  return useQuery({
    queryKey: ["recent-foods"],
    queryFn: () =>
      fetch("/api/recent-foods")
        .then((r) => r.json())
        .then((d) => d.foods as RecentFood[]),
    staleTime: 5 * 60_000,
  });
}
