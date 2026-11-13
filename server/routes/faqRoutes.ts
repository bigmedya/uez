import { RequestHandler } from "express";
import {
  getFAQData,
  getFAQItems,
  getActiveFAQItems,
  addFAQItem,
  updateFAQItem,
  deleteFAQItem,
  reorderFAQItems,
} from "../db/faq";

// Get all FAQ items (for admin)
export const getFAQHandler: RequestHandler = (_req, res) => {
  try {
    const data = getFAQData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Get active FAQ items (?locale=en)
export const getActiveFAQHandler: RequestHandler = (req, res) => {
  try {
    const locale = req.query.locale === "en" ? "en" : undefined;
    const items = getActiveFAQItems(locale);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Add new FAQ item (question_en, answer_en optional)
export const addFAQHandler: RequestHandler = (req, res) => {
  try {
    const { question, question_en, answer, answer_en, active } = req.body;
    if (!question || !answer) {
      res.status(400).json({ error: "question and answer are required" });
      return;
    }
    const item = addFAQItem({
      question,
      question_en,
      answer,
      answer_en,
      active: active !== false
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update FAQ item
export const updateFAQHandler: RequestHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = updateFAQItem(id, req.body);
    if (!item) {
      res.status(404).json({ error: "FAQ item not found" });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Delete FAQ item
export const deleteFAQHandler: RequestHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = deleteFAQItem(id);
    if (!success) {
      res.status(404).json({ error: "FAQ item not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Reorder FAQ items
export const reorderFAQHandler: RequestHandler = (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      res.status(400).json({ error: "itemIds must be an array" });
      return;
    }
    const items = reorderFAQItems(itemIds);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};






