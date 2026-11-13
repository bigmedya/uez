import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const CONTACT_KEY = "main";
const DATA_FILE = path.join(process.cwd(), "data", "contact.json");

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

const defaultContactData: ContactData = {
  hero: { title: "Bize Ulaşın", subtitle: "" },
  infoSection: { title: "İletişim Bilgileri", description: "" },
  contactCards: [],
  formSection: { title: "Mesaj Gönderin", buttonText: "Mesaj Gönder", successMessage: "", subjects: [] },
  mapSection: { title: "Etkinlik Lokasyonu", image: "", venueName: "", venueDetails: "", embedUrl: "" },
  updatedAt: new Date().toISOString(),
};

/** Prisma'dan iletişim verisini oku. Yoksa contact.json'dan seed yapıp kaydet. */
export async function getContactData(): Promise<ContactData> {
  const row = await prisma.contact_settings.findUnique({ where: { key: CONTACT_KEY } });
  if (row && row.value && typeof row.value === "object") {
    const data = row.value as unknown as ContactData;
    if (data.hero && data.contactCards && data.formSection && data.mapSection) {
      return { ...data, updatedAt: row.updatedAt.toISOString() };
    }
  }
  // Yoksa JSON dosyasından seed yap
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(content) as ContactData;
      data.updatedAt = new Date().toISOString();
      await prisma.contact_settings.upsert({
        where: { key: CONTACT_KEY },
        create: { key: CONTACT_KEY, value: data as object, updatedAt: new Date() },
        update: { value: data as object, updatedAt: new Date() },
      });
      return data;
    } catch {
      // JSON hatalıysa default dön
    }
  }
  return defaultContactData;
}

export type ContactLocale = "tr" | "en";

/** Site için dile göre çözümlenmiş iletişim verisi (EN alanları ana alanlara yansıtılır) */
export async function getContactDataForLocale(locale: ContactLocale): Promise<ContactData> {
  const raw = await getContactData();
  const isEn = locale === "en";

  return {
    ...raw,
    hero: {
      title: isEn ? (raw.hero.title_en || raw.hero.title) : raw.hero.title,
      subtitle: isEn ? (raw.hero.subtitle_en || raw.hero.subtitle) : raw.hero.subtitle,
    },
    infoSection: {
      title: isEn ? (raw.infoSection.title_en || raw.infoSection.title) : raw.infoSection.title,
      description: isEn ? (raw.infoSection.description_en ?? raw.infoSection.description) : raw.infoSection.description,
    },
    contactCards: raw.contactCards.map((c) => ({
      ...c,
      title: isEn ? (c.title_en || c.title) : c.title,
      lines: isEn && c.lines_en?.length ? c.lines_en : c.lines,
    })),
    formSection: {
      title: isEn ? (raw.formSection.title_en || raw.formSection.title) : raw.formSection.title,
      buttonText: isEn ? (raw.formSection.buttonText_en || raw.formSection.buttonText) : raw.formSection.buttonText,
      successMessage: isEn ? (raw.formSection.successMessage_en ?? raw.formSection.successMessage) : raw.formSection.successMessage,
      subjects: raw.formSection.subjects.map((s) => ({
        ...s,
        label: isEn ? (s.label_en || s.label) : s.label,
      })),
    },
    mapSection: {
      ...raw.mapSection,
      title: isEn ? (raw.mapSection.title_en || raw.mapSection.title) : raw.mapSection.title,
      venueName: isEn ? (raw.mapSection.venueName_en || raw.mapSection.venueName) : raw.mapSection.venueName,
      venueDetails: isEn ? (raw.mapSection.venueDetails_en ?? raw.mapSection.venueDetails) : raw.mapSection.venueDetails,
    },
    updatedAt: raw.updatedAt,
  };
}

export async function saveContactData(data: ContactData): Promise<ContactData> {
  data.updatedAt = new Date().toISOString();
  await prisma.contact_settings.upsert({
    where: { key: CONTACT_KEY },
    create: { key: CONTACT_KEY, value: data as object, updatedAt: new Date() },
    update: { value: data as object, updatedAt: new Date() },
  });
  return data;
}

export async function updateHero(heroData: Partial<ContactData["hero"]>): Promise<ContactData> {
  const data = await getContactData();
  data.hero = { ...data.hero, ...heroData };
  return saveContactData(data);
}

export async function updateInfoSection(infoData: Partial<ContactData["infoSection"]>): Promise<ContactData> {
  const data = await getContactData();
  data.infoSection = { ...data.infoSection, ...infoData };
  return saveContactData(data);
}

export async function updateFormSection(formData: Partial<ContactData["formSection"]>): Promise<ContactData> {
  const data = await getContactData();
  data.formSection = { ...data.formSection, ...formData };
  return saveContactData(data);
}

export async function updateMapSection(mapData: Partial<ContactData["mapSection"]>): Promise<ContactData> {
  const data = await getContactData();
  data.mapSection = { ...data.mapSection, ...mapData };
  return saveContactData(data);
}

export async function addContactCard(card: Omit<ContactCard, "id" | "order">): Promise<ContactCard> {
  const data = await getContactData();
  const maxId = Math.max(0, ...data.contactCards.map((c) => c.id));
  const maxOrder = Math.max(0, ...data.contactCards.map((c) => c.order));
  const newCard: ContactCard = { ...card, id: maxId + 1, order: maxOrder + 1 };
  data.contactCards.push(newCard);
  await saveContactData(data);
  return newCard;
}

export async function updateContactCard(id: number, updates: Partial<ContactCard>): Promise<ContactCard | null> {
  const data = await getContactData();
  const card = data.contactCards.find((c) => c.id === id);
  if (!card) return null;
  Object.assign(card, updates);
  await saveContactData(data);
  return card;
}

export async function deleteContactCard(id: number): Promise<boolean> {
  const data = await getContactData();
  const index = data.contactCards.findIndex((c) => c.id === id);
  if (index === -1) return false;
  data.contactCards.splice(index, 1);
  await saveContactData(data);
  return true;
}

export async function reorderContactCards(cardIds: number[]): Promise<ContactCard[]> {
  const data = await getContactData();
  cardIds.forEach((id, index) => {
    const card = data.contactCards.find((c) => c.id === id);
    if (card) card.order = index + 1;
  });
  await saveContactData(data);
  return data.contactCards.sort((a, b) => a.order - b.order);
}
