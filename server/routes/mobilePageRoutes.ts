import { RequestHandler } from "express";
import {
  getMobilePageData,
  getMobilePageDataForLocale,
  updateMobilePageData,
} from "../db/mobilePage";

// GET /api/mobile-page — locale=tr|en ile site için dilde veri; yoksa admin için ham veri (_en alanlarıyla)
export const getMobilePageHandler: RequestHandler = async (req, res) => {
  try {
    const locale = (req.query.locale as string) || "";
    if (locale === "en" || locale === "tr") {
      const data = await getMobilePageDataForLocale(locale as "tr" | "en");
      return res.json(data);
    }
    const data = await getMobilePageData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// PUT /api/mobile-page
export const updateMobilePageHandler: RequestHandler = async (req, res) => {
  try {
    const updated = await updateMobilePageData(req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
