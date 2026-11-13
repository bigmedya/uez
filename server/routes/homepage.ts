import { RequestHandler } from "express";
import {
  getHomepageData,
  getHomepageDataForLocale,
  updateHomepageData,
  updateHero,
  updateCounters,
  updateInfoBanner,
} from "../db/homepage";

// Get homepage: ?locale=en|tr → site için çözümlenmiş; yoksa admin için ham veri
export const getHomepageHandler: RequestHandler = async (req, res) => {
  try {
    const locale = (req.query.locale as string) || "";
    if (locale === "en" || locale === "tr") {
      const data = await getHomepageDataForLocale(locale);
      return res.json(data);
    }
    const data = await getHomepageData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update all homepage data
export const updateHomepageHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateHomepageData(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update hero section only
export const updateHeroHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateHero(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update counters only
export const updateCountersHandler: RequestHandler = async (req, res) => {
  try {
    const { counters } = req.body;
    if (!Array.isArray(counters)) {
      res.status(400).json({ error: "counters must be an array" });
      return;
    }
    const data = await updateCounters(counters);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update info banner only
export const updateInfoBannerHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateInfoBanner(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};






