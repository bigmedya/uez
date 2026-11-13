import { RequestHandler } from "express";
import { getSettings, updateSettings, resetSettings } from "../db/settings";

// GET /api/settings?locale=en  (public)  |  ?forAdmin=1 (admin: full record with _en)
export const getSettingsHandler: RequestHandler = async (req, res) => {
  try {
    const forAdmin = req.query.forAdmin === "1";
    const locale = typeof req.query.locale === "string" ? req.query.locale : undefined;
    const settings = await getSettings(locale, forAdmin);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// PUT /api/settings — body may include siteTitle_en, metaDescription_en, etc.
export const updateSettingsHandler: RequestHandler = async (req, res) => {
  try {
    const updates = req.body;
    const settings = await updateSettings(updates);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// POST /api/settings/reset
export const resetSettingsHandler: RequestHandler = async (_req, res) => {
  try {
    const settings = await resetSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
