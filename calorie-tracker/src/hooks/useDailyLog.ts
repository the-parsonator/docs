import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type FoodEntry = {
  id: number;
  name: string;
  calories: number;
  timestamp: string;
};

type DailyLog = {
  id: number;
  date: string;
  calorieTarget: number;
  foodEntries: FoodEntry[];
};

async function fetchDailyLog(): Promise<{ log: DailyLog }> {
  const res = await fetch("/api/daily-log");
  if (!res.ok) throw new Error("Failed.");
  return res.json();
}

export function useDailyLog() {
  return useQuery({
    queryKey: ["daily-log"],
    queryFn: fetchDailyLog,
    staleTime: 60_000,
  });
}

export function useAddFoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; calories: number }) => {
      const res = await fetch("/api/food-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed.");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-log"] }),
  });
}

export function useDeleteFoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/food-entry/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-log"] }),
  });
}
