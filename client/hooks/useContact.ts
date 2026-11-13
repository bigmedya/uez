import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ContactCard {
  id: number;
  icon: "location" | "phone" | "email" | "clock" | "press";
  title: string;
  title_en?: string;
  lines: string[];
  lines_en?: string[];
  color: "purple" | "orange";
  order: number;
}

export interface Subject {
  value: string;
  label: string;
  label_en?: string;
}

export interface ContactData {
  hero: {
    title: string;
    subtitle: string;
    title_en?: string;
    subtitle_en?: string;
  };
  infoSection: {
    title: string;
    description: string;
    title_en?: string;
    description_en?: string;
  };
  contactCards: ContactCard[];
  formSection: {
    title: string;
    buttonText: string;
    successMessage: string;
    title_en?: string;
    buttonText_en?: string;
    successMessage_en?: string;
    subjects: Subject[];
  };
  mapSection: {
    title: string;
    image: string;
    venueName: string;
    venueDetails: string;
    title_en?: string;
    venueName_en?: string;
    venueDetails_en?: string;
    embedUrl?: string;
  };
  updatedAt: string;
}

async function fetchContact(locale?: string): Promise<ContactData> {
  const url = locale === "en" || locale === "tr" ? `/api/contact?locale=${locale}` : "/api/contact";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch contact data");
  return res.json();
}

async function updateContact(data: Partial<ContactData>): Promise<ContactData> {
  const res = await fetch("/api/contact", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

/** @param locale - "tr" | "en" ile site diline göre veri; verilmezse admin için ham veri (TR + _en alanları) döner */
export function useContact(locale?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["contact", locale ?? "raw"],
    queryFn: () => fetchContact(locale),
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateContact,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact"] }),
  });

  return {
    data,
    hero: data?.hero,
    infoSection: data?.infoSection,
    contactCards: data?.contactCards?.sort((a, b) => a.order - b.order) || [],
    formSection: data?.formSection,
    mapSection: data?.mapSection,
    isLoading,
    error,
    updateData: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}






