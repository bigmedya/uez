export interface QuickAction {
  id: number;
  key: string;
  title: string;
  title_en?: string;
  icon: string; // icon name from lucide-react
  href: string;
  order: number;
  active: boolean;
  /** Panelden düzenlenen açıklama; howto, map, faq vb. için mobilde açılan panelde gösterilir */
  description?: string;
  description_en?: string;
}

export interface SocialMedia {
  platform: "linkedin" | "facebook" | "instagram" | "youtube" | "twitter";
  url: string;
  active: boolean;
}

export interface MobilePageData {
  eventDate: string;
  eventDate_en?: string;
  eventTime: string;
  eventTime_en?: string;
  venueName: string;
  venueName_en?: string;
  venueDetails: string;
  venueDetails_en?: string;
  locationLink?: string;
  logoUrl: string;
  ticketButtonText: string;
  ticketButtonText_en?: string;
  ticketButtonLink: string;
  quickActions: QuickAction[];
  aboutText: string;
  aboutText_en?: string;
  aboutLink: string;
  hostName: string;
  hostName_en?: string;
  hostLogo: string;
  socialMedia: SocialMedia[];
  updatedAt: string;
}
