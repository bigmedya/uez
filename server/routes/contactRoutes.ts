import { RequestHandler } from "express";
import {
  getContactData,
  getContactDataForLocale,
  saveContactData,
  updateHero,
  updateInfoSection,
  updateFormSection,
  updateMapSection,
  addContactCard,
  updateContactCard,
  deleteContactCard,
  reorderContactCards,
} from "../db/contact";

// Get contact data for site (locale) or admin (no locale = raw with _en fields)
export const getContactHandler: RequestHandler = async (req, res) => {
  try {
    const locale = (req.query.locale as string) || "";
    if (locale === "en" || locale === "tr") {
      const data = await getContactDataForLocale(locale as "tr" | "en");
      return res.json(data);
    }
    const data = await getContactData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update all data
export const updateContactHandler: RequestHandler = async (req, res) => {
  try {
    const data = await saveContactData(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update hero
export const updateContactHeroHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateHero(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update info section
export const updateInfoSectionHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateInfoSection(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update form section
export const updateFormSectionHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateFormSection(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update map section
export const updateMapSectionHandler: RequestHandler = async (req, res) => {
  try {
    const data = await updateMapSection(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Add contact card
export const addContactCardHandler: RequestHandler = async (req, res) => {
  try {
    const card = await addContactCard(req.body);
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update contact card
export const updateContactCardHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const card = await updateContactCard(id, req.body);
    if (!card) {
      res.status(404).json({ error: "Contact card not found" });
      return;
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Delete contact card
export const deleteContactCardHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await deleteContactCard(id);
    if (!success) {
      res.status(404).json({ error: "Contact card not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Reorder contact cards
export const reorderContactCardsHandler: RequestHandler = async (req, res) => {
  try {
    const { cardIds } = req.body;
    if (!Array.isArray(cardIds)) {
      res.status(400).json({ error: "cardIds must be an array" });
      return;
    }
    const cards = await reorderContactCards(cardIds);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
