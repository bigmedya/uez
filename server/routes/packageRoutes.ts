import { RequestHandler } from "express";
import {
  getPackages,
  getPackageById,
  getPackageByPackageId,
  createPackage,
  updatePackage,
  deletePackage,
} from "../db/packages";

// GET /api/packages (?locale=en)
export const getPackagesHandler: RequestHandler = async (req, res) => {
  try {
    const activeOnly = req.query.active === "true";
    const locale = req.query.locale === "en" ? "en" : undefined;
    const packages = await getPackages(activeOnly, locale);
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: "Paketler alınırken bir hata oluştu" });
  }
};

// GET /api/packages/:id
export const getPackageHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const pkg = await getPackageById(id);
    
    if (!pkg) {
      res.status(404).json({ error: "Paket bulunamadı" });
      return;
    }
    
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: "Paket alınırken bir hata oluştu" });
  }
};

// POST /api/packages (title_en, subtitle_en, features_en optional)
export const createPackageHandler: RequestHandler = async (req, res) => {
  try {
    const { packageId, title, title_en, subtitle, subtitle_en, price, features, features_en, active, order } = req.body;
    
    if (!packageId || !title || !price || !features) {
      res.status(400).json({ error: "packageId, title, price, and features are required" });
      return;
    }
    
    const pkg = await createPackage({
      packageId,
      title,
      title_en: title_en ?? undefined,
      subtitle: subtitle || "",
      subtitle_en: subtitle_en ?? undefined,
      price,
      features: Array.isArray(features) ? features : [],
      features_en: Array.isArray(features_en) ? features_en : undefined,
      active: active !== undefined ? active : true,
      order: order || 0,
    });
    
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: "Paket oluşturulurken bir hata oluştu" });
  }
};

// PUT /api/packages/:id (title_en, subtitle_en, features_en optional)
export const updatePackageHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const { packageId, title, title_en, subtitle, subtitle_en, price, features, features_en, active, order } = req.body;
    
    const pkg = await updatePackage(id, {
      ...(packageId && { packageId }),
      ...(title !== undefined && { title }),
      ...(title_en !== undefined && { title_en }),
      ...(subtitle !== undefined && { subtitle }),
      ...(subtitle_en !== undefined && { subtitle_en }),
      ...(price && { price }),
      ...(features && { features: Array.isArray(features) ? features : [] }),
      ...(features_en !== undefined && { features_en: Array.isArray(features_en) ? features_en : null }),
      ...(active !== undefined && { active }),
      ...(order !== undefined && { order }),
    });
    
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: "Paket güncellenirken bir hata oluştu" });
  }
};

// DELETE /api/packages/:id
export const deletePackageHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const deleted = await deletePackage(id);
    
    if (!deleted) {
      res.status(404).json({ error: "Paket bulunamadı" });
      return;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Paket silinirken bir hata oluştu" });
  }
};

