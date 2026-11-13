import { RequestHandler } from "express";
import {
  getArchiveDescriptionByYear,
  getAllArchiveDescriptions,
  upsertArchiveDescription,
  deleteArchiveDescription,
} from "../db/archive";

// GET /api/archive/:year (?locale=en)
export const getArchiveDescription: RequestHandler = async (req, res) => {
  try {
    const year = req.params.year;
    const locale = req.query.locale === "en" ? "en" : undefined;
    const archive = await getArchiveDescriptionByYear(year, locale);

    if (!archive) {
      res.status(404).json({ error: "Archive description not found" });
      return;
    }

    res.json(archive);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// GET /api/archive
export const getAllArchiveDescriptionsHandler: RequestHandler = async (req, res) => {
  try {
    const archives = await getAllArchiveDescriptions();
    res.json(archives);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// POST /api/archive (description_en optional)
export const createOrUpdateArchiveDescription: RequestHandler = async (req, res) => {
  try {
    const { year, description, description_en } = req.body;

    if (!year || !description) {
      res.status(400).json({ error: "Year and description are required" });
      return;
    }

    const archive = await upsertArchiveDescription(year, description, description_en);
    res.json(archive);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// DELETE /api/archive/:year
export const deleteArchiveDescriptionHandler: RequestHandler = async (req, res) => {
  try {
    const year = req.params.year;
    const deleted = await deleteArchiveDescription(year);
    
    if (!deleted) {
      res.status(404).json({ error: "Archive description not found" });
      return;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
