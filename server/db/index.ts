import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data");
const SPEAKERS_FILE = path.join(DB_PATH, "speakers.json");

// Ensure data directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

export interface Speaker {
  id: number;
  name: string;
  slug: string;
  title: string;
  photo: string;
  bio: string;
  year: string;
  order: number;
  wpPostId?: number; // WordPress post ID for linking with schedule
  createdAt: string;
  updatedAt: string;
}

// Initialize speakers file if not exists
if (!fs.existsSync(SPEAKERS_FILE)) {
  fs.writeFileSync(SPEAKERS_FILE, JSON.stringify([], null, 2));
}

export function getSpeakers(): Speaker[] {
  const data = fs.readFileSync(SPEAKERS_FILE, "utf-8");
  return JSON.parse(data);
}

export function getSpeakerById(id: number): Speaker | undefined {
  const speakers = getSpeakers();
  return speakers.find((s) => s.id === id);
}

export function getSpeakersByYear(year: string): Speaker[] {
  const speakers = getSpeakers();
  return speakers.filter((s) => s.year === year);
}

export function addSpeaker(speaker: Omit<Speaker, "id" | "createdAt" | "updatedAt">): Speaker {
  const speakers = getSpeakers();
  const newId = speakers.length > 0 ? Math.max(...speakers.map((s) => s.id)) + 1 : 1;
  const now = new Date().toISOString();
  
  const newSpeaker: Speaker = {
    ...speaker,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  
  speakers.push(newSpeaker);
  fs.writeFileSync(SPEAKERS_FILE, JSON.stringify(speakers, null, 2));
  
  return newSpeaker;
}

export function updateSpeaker(id: number, updates: Partial<Speaker>): Speaker | null {
  const speakers = getSpeakers();
  const index = speakers.findIndex((s) => s.id === id);
  
  if (index === -1) return null;
  
  speakers[index] = {
    ...speakers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(SPEAKERS_FILE, JSON.stringify(speakers, null, 2));
  return speakers[index];
}

export function deleteSpeaker(id: number): boolean {
  const speakers = getSpeakers();
  const filtered = speakers.filter((s) => s.id !== id);
  
  if (filtered.length === speakers.length) return false;
  
  fs.writeFileSync(SPEAKERS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export function importSpeakers(newSpeakers: Omit<Speaker, "id" | "createdAt" | "updatedAt">[]): number {
  const speakers = getSpeakers();
  const now = new Date().toISOString();
  let maxId = speakers.length > 0 ? Math.max(...speakers.map((s) => s.id)) : 0;
  
  const toAdd = newSpeakers.map((s) => ({
    ...s,
    id: ++maxId,
    createdAt: now,
    updatedAt: now,
  }));
  
  const allSpeakers = [...speakers, ...toAdd];
  fs.writeFileSync(SPEAKERS_FILE, JSON.stringify(allSpeakers, null, 2));
  
  return toAdd.length;
}

export function clearSpeakers(): void {
  fs.writeFileSync(SPEAKERS_FILE, JSON.stringify([], null, 2));
}

