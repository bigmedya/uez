import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

export interface FAQData {
  items: FAQItem[];
  updatedAt: string;
}

async function fetchFAQ(): Promise<FAQData> {
  const res = await fetch("/api/faq");
  if (!res.ok) throw new Error("Failed to fetch FAQ");
  return res.json();
}

async function fetchActiveFAQ(locale?: "tr" | "en"): Promise<FAQItem[]> {
  const url = locale ? `/api/faq/active?locale=${locale}` : "/api/faq/active";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch FAQ");
  return res.json();
}

async function addFAQItem(item: { question: string; answer: string; active?: boolean }): Promise<FAQItem> {
  const res = await fetch("/api/faq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to add FAQ item");
  return res.json();
}

async function updateFAQItem(id: number, updates: Partial<FAQItem>): Promise<FAQItem> {
  const res = await fetch(`/api/faq/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update FAQ item");
  return res.json();
}

async function deleteFAQItemApi(id: number): Promise<void> {
  const res = await fetch(`/api/faq/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete FAQ item");
}

async function reorderFAQ(itemIds: number[]): Promise<FAQItem[]> {
  const res = await fetch("/api/faq/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder FAQ");
  return res.json();
}

export function useFaq() {
  const queryClient = useQueryClient();

  const { data: faqData, isLoading, error } = useQuery({
    queryKey: ["faq"],
    queryFn: fetchFAQ,
    staleTime: 1000 * 60 * 5,
  });

  const addMutation = useMutation({
    mutationFn: addFAQItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<FAQItem> }) =>
      updateFAQItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFAQItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq"] });
    },
  });

  return {
    faqData,
    items: faqData?.items?.sort((a, b) => a.order - b.order) || [],
    isLoading,
    error,
    addItem: addMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    reorderItems: reorderMutation.mutate,
    isUpdating:
      addMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      reorderMutation.isPending,
  };
}

export function useActiveFaq(locale?: "tr" | "en") {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ["faq-active", locale],
    queryFn: () => fetchActiveFAQ(locale),
    staleTime: 1000 * 60 * 5,
  });

  return {
    items: items || [],
    isLoading,
    error,
  };
}






