import { RequestHandler } from "express";
import {
  getUEZ2026Data,
  saveUEZ2026Data,
  resolveForLocale,
  updateHero,
  updateIntro,
  updateTopicsSection,
  addTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
  type Locale,
  type UEZ2026DataRaw,
} from "../db/uez2026";

// Get all UEZ 2026 data (admin: raw TR/EN)
export const getUEZ2026Handler: RequestHandler = async (_req, res) => {
  try {
    const data = await getUEZ2026Data();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Get public data (resolved for locale: ?locale=tr|en)
export const getPublicUEZ2026Handler: RequestHandler = async (req, res) => {
  try {
    const raw = await getUEZ2026Data();
    const locale: Locale = req.query.locale === "en" ? "en" : "tr";
    const data = resolveForLocale(raw, locale);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update all data (admin: raw TR/EN)
export const updateUEZ2026Handler: RequestHandler = async (req, res) => {
  try {
    const data = await saveUEZ2026Data(req.body as UEZ2026DataRaw);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update hero
export const updateHeroHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateHero(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update intro
export const updateIntroHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateIntro(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update topics section titles
export const updateTopicsSectionHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateTopicsSection(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Add topic (accepts title_tr, title_en, description_tr, description_en, image, active)
export const addTopicHandler: RequestHandler = async (req, res) => {
  try {
    const { title_tr, title_en, description_tr, description_en, image, active } = req.body;
    if (!title_tr && !title_en) {
      res.status(400).json({ error: "title_tr or title_en is required" });
      return;
    }
    const topic = await addTopic({
      title_tr: title_tr ?? "",
      title_en: title_en ?? "",
      description_tr: description_tr ?? "",
      description_en: description_en ?? "",
      image: image ?? "",
      active: active !== false,
    });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update topic
export const updateTopicHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const topic = await updateTopic(id, req.body);
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Delete topic
export const deleteTopicHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await deleteTopic(id);
    if (!success) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Reorder topics
export const reorderTopicsHandler: RequestHandler = async (req, res) => {
  try {
    const { topicIds } = req.body;
    if (!Array.isArray(topicIds)) {
      res.status(400).json({ error: "topicIds must be an array" });
      return;
    }
    const topics = await reorderTopics(topicIds);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
