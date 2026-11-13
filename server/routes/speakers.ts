import { RequestHandler } from "express";
import { 
  getSpeakers, 
  getSpeakerById, 
  getSpeakersByYear, 
  addSpeaker, 
  updateSpeaker, 
  deleteSpeaker,
  importSpeakers,
  clearSpeakers,
  toggleSpeakerPinForYear,
  Speaker 
} from "../db/speakers";

// GET /api/speakers?year=...&locale=tr|en
export const getAllSpeakers: RequestHandler = async (req, res) => {
  try {
    const year = req.query.year as string | undefined;
    const locale = req.query.locale as string | undefined;
    const lang = locale === "en" ? "en" : undefined;

    if (year) {
      const speakers = await getSpeakersByYear(year, lang);
      res.json(speakers);
    } else {
      const speakers = await getSpeakers(lang);
      res.json(speakers);
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// GET /api/speakers/:id?locale=tr|en
export const getSpeaker: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const locale = req.query.locale as string | undefined;
    const lang = locale === "en" ? "en" : undefined;
    const speaker = await getSpeakerById(id, lang);

    if (!speaker) {
      res.status(404).json({ error: "Speaker not found" });
      return;
    }

    res.json(speaker);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// POST /api/speakers (body: company, position required for new format; titleEn, biographyEn, companyEn, positionEn optional)
export const createSpeaker: RequestHandler = async (req, res) => {
  try {
    const { name, slug, title, titleEn, company, companyEn, position, positionEn, photo, bio, biographyEn, year, order, pinnedYears } = req.body;

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Yeni konuşmacılar için company ve position zorunlu
    if (!company || !position) {
      res.status(400).json({ error: "Company and position are required" });
      return;
    }

    const speaker = await addSpeaker({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      title: title || "",
      titleEn: titleEn || undefined,
      company: company || "",
      companyEn: companyEn || undefined,
      position: position || "",
      positionEn: positionEn || undefined,
      photo: photo || "",
      bio: bio || "",
      biographyEn: biographyEn || undefined,
      year: year || new Date().getFullYear().toString(),
      order: order || 0,
      pinnedYears: pinnedYears || [],
    });

    res.status(201).json(speaker);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// PUT /api/speakers/:id
export const updateSpeakerHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const updates = req.body;
  
    const speaker = await updateSpeaker(id, updates);
  
  if (!speaker) {
    res.status(404).json({ error: "Speaker not found" });
    return;
  }
  
  res.json(speaker);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// DELETE /api/speakers/:id
export const deleteSpeakerHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const deleted = await deleteSpeaker(id);
  
  if (!deleted) {
    res.status(404).json({ error: "Speaker not found" });
    return;
  }
  
  res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// POST /api/speakers/import
export const importSpeakersHandler: RequestHandler = async (req, res) => {
  try {
  const { speakers, clearExisting } = req.body as { 
    speakers: Omit<Speaker, "id" | "createdAt" | "updatedAt">[];
    clearExisting?: boolean;
  };
  
  if (!speakers || !Array.isArray(speakers)) {
    res.status(400).json({ error: "Speakers array is required" });
    return;
  }
  
  if (clearExisting) {
      await clearSpeakers();
  }
  
    const count = await importSpeakers(speakers);
  res.json({ success: true, imported: count });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// POST /api/speakers/:id/toggle-pin/:year
export const toggleSpeakerPinForYearHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const year = Array.isArray(req.params.year) ? req.params.year[0] : req.params.year;
    
    if (!year) {
      res.status(400).json({ error: "Year is required" });
      return;
    }
    
    const speaker = await toggleSpeakerPinForYear(id, year);
    
    if (!speaker) {
      res.status(404).json({ error: "Speaker not found" });
      return;
    }
    
    res.json(speaker);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};






