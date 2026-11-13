import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "faq.json");

export interface FAQItem {
  id: number;
  question: string;
  question_en?: string;
  answer: string;
  answer_en?: string;
  order: number;
  active: boolean;
}

export interface FAQData {
  items: FAQItem[];
  updatedAt: string;
}

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData: FAQData = {
      items: [],
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
}

export function getFAQData(): FAQData {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

export function saveFAQData(data: FAQData): FAQData {
  ensureDataFile();
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}

export function getFAQItems(): FAQItem[] {
  return getFAQData().items.sort((a, b) => a.order - b.order);
}

// locale?: "en" returns question_en/answer_en when set
export function getActiveFAQItems(locale?: string): FAQItem[] {
  const items = getFAQItems().filter(item => item.active);
  if (locale !== "en") return items;
  return items.map((item) => ({
    ...item,
    question: item.question_en || item.question,
    answer: item.answer_en || item.answer,
  }));
}

export function addFAQItem(item: Omit<FAQItem, "id" | "order"> & { question_en?: string; answer_en?: string }): FAQItem {
  const data = getFAQData();
  const maxId = Math.max(0, ...data.items.map(i => i.id));
  const maxOrder = Math.max(0, ...data.items.map(i => i.order));

  const newItem: FAQItem = {
    ...item,
    question_en: item.question_en,
    answer_en: item.answer_en,
    id: maxId + 1,
    order: maxOrder + 1
  };

  data.items.push(newItem);
  saveFAQData(data);
  return newItem;
}

export function updateFAQItem(id: number, updates: Partial<FAQItem> & { question_en?: string; answer_en?: string }): FAQItem | null {
  const data = getFAQData();
  const item = data.items.find(i => i.id === id);
  if (!item) return null;

  Object.assign(item, updates);
  saveFAQData(data);
  return item;
}

export function deleteFAQItem(id: number): boolean {
  const data = getFAQData();
  const index = data.items.findIndex(i => i.id === id);
  if (index === -1) return false;
  
  data.items.splice(index, 1);
  saveFAQData(data);
  return true;
}

export function reorderFAQItems(itemIds: number[]): FAQItem[] {
  const data = getFAQData();
  itemIds.forEach((id, index) => {
    const item = data.items.find(i => i.id === id);
    if (item) {
      item.order = index + 1;
    }
  });
  saveFAQData(data);
  return getFAQItems();
}






