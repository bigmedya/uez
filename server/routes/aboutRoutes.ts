import { RequestHandler } from "express";
import {
  getAboutData,
  getAboutDataForLocale,
  saveAboutData,
  updateHero,
  getSections,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
} from "../db/about";

// GET /api/about (?locale=en|tr → site için çözümlenmiş; yoksa admin için ham veri)
export const getAboutHandler: RequestHandler = async (req, res) => {
  try {
    const locale = (req.query.locale as string) || "";
    if (locale === "en" || locale === "tr") {
      const data = await getAboutDataForLocale(locale);
      return res.json(data);
    }
    const data = await getAboutData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateAboutHandler: RequestHandler = async (req, res) => {
  try {
    const data = await saveAboutData(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateAboutHeroHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateHero(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const addSectionHandler: RequestHandler = async (req, res) => {
  try {
    const section = await addSection(req.body);
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateSectionHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const section = await updateSection(id, req.body);
    if (!section) {
      res.status(404).json({ error: "Section not found" });
      return;
    }
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const deleteSectionHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const success = await deleteSection(id);
    if (!success) {
      res.status(404).json({ error: "Section not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const reorderSectionsHandler: RequestHandler = async (req, res) => {
  try {
    const { sectionIds } = req.body;
    if (!Array.isArray(sectionIds)) {
      res.status(400).json({ error: "sectionIds must be an array" });
      return;
    }
    const sections = await reorderSections(sectionIds);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
