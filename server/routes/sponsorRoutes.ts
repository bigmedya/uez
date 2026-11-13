import { RequestHandler } from "express";
import {
  getSponsorsData,
  getSponsorsDataByYear,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  moveSponsor,
  reorderSponsors,
} from "../db/sponsors";

// Get all sponsors data (?locale=en, year = filter)
export const getSponsorsHandler: RequestHandler = async (req, res) => {
  try {
    const yearParam = req.query.year as string | undefined;
    const locale = req.query.locale === "en" ? "en" : undefined;
    const year = yearParam?.trim();

    if (year) {
      const data = await getSponsorsDataByYear(year, locale);
      res.json(data);
    } else {
      const data = await getSponsorsData(locale);
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Get categories only
export const getCategoriesHandler: RequestHandler = async (_req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Add category
export const addCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const { title, title_en } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ error: "Kategori adı gerekli" });
      return;
    }
    const category = await addCategory(title.trim(), title_en?.trim());
    res.json(category);
  } catch (error) {
    console.error("Add category error:", error);
    res.status(500).json({ error: String(error) });
  }
};

// Update category (title_en optional)
export const updateCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, title_en } = req.body;
    const category = await updateCategory(id, title, title_en?.trim());
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Delete category
export const deleteCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await deleteCategory(id);
    if (!success) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Reorder categories
export const reorderCategoriesHandler: RequestHandler = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    if (!Array.isArray(categoryIds)) {
      res.status(400).json({ error: "categoryIds must be an array" });
      return;
    }
    const categories = await reorderCategories(categoryIds);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Add sponsor
export const addSponsorHandler: RequestHandler = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const { name, name_en, image, localImage, url, active, year, width } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Sponsor adı gerekli" });
      return;
    }

    if (isNaN(categoryId)) {
      res.status(400).json({ error: "Geçersiz kategori ID" });
      return;
    }

    const sponsor = await addSponsor(categoryId, {
      name: name.trim(),
      name_en: name_en !== undefined ? (name_en === "" ? undefined : name_en) : undefined,
      image: image || "",
      localImage: localImage || "",
      url: url || "",
      active: active !== false,
      year: year !== undefined && year !== null ? year : undefined,
      width: width !== undefined && width !== null && !isNaN(width) ? width : undefined,
    });
    
    if (!sponsor) {
      res.status(404).json({ error: "Kategori bulunamadı" });
      return;
    }
    res.json(sponsor);
  } catch (error) {
    console.error("Add sponsor error:", error);
    res.status(500).json({ error: String(error) });
  }
};

// Update sponsor
export const updateSponsorHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      res.status(400).json({ error: "Geçersiz sponsor ID" });
      return;
    }

    console.log("Updating sponsor:", { id, updates: req.body });
    
    const sponsor = await updateSponsor(id, req.body);
    if (!sponsor) {
      res.status(404).json({ error: "Sponsor bulunamadı" });
      return;
    }
    res.json(sponsor);
  } catch (error) {
    console.error("Update sponsor error:", error);
    res.status(500).json({ error: String(error) });
  }
};

// Delete sponsor
export const deleteSponsorHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await deleteSponsor(id);
    if (!success) {
      res.status(404).json({ error: "Sponsor not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Move sponsor to different category
export const moveSponsorHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { categoryId } = req.body;
    const success = await moveSponsor(id, categoryId);
    if (!success) {
      res.status(404).json({ error: "Sponsor or category not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Reorder sponsors within a category
export const reorderSponsorsHandler: RequestHandler = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    const { sponsorIds } = req.body;
    if (!Array.isArray(sponsorIds)) {
      res.status(400).json({ error: "sponsorIds must be an array" });
      return;
    }
    const ids = sponsorIds.map((id: unknown) => (typeof id === "number" ? id : parseInt(String(id), 10))).filter((n) => !isNaN(n));
    const success = await reorderSponsors(categoryId, ids);
    if (!success) {
      res.status(500).json({ error: "Reorder failed" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update all sponsors data (bulk update) - Deprecated, use individual endpoints
export const updateSponsorsDataHandler: RequestHandler = async (req, res) => {
  try {
    // This endpoint is kept for backward compatibility but should use individual endpoints
    res.status(400).json({ error: "This endpoint is deprecated. Use individual category/sponsor endpoints instead." });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
