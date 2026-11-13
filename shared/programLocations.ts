/** Oturum konumu seçenekleri */
export const PROGRAM_SESSION_LOCATIONS = [
  "Amber Salonu",
  "Ihlamur Restaurant",
  "Lobby Fuaye",
] as const;

export type ProgramSessionLocation = (typeof PROGRAM_SESSION_LOCATIONS)[number];

export function locationPhraseInLocative(location: string): string {
  const map: Record<string, string> = {
    "Amber Salonu": "Amber Salonu'nda",
    "Ihlamur Restaurant": "Ihlamur Restaurant'ta",
    "Lobby Fuaye": "Lobby Fuaye'de",
  };
  return map[location] ?? location;
}

export function isValidProgramLocation(value: string | null | undefined): value is ProgramSessionLocation {
  if (!value) return false;
  return (PROGRAM_SESSION_LOCATIONS as readonly string[]).includes(value);
}
