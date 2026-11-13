import { RequestHandler } from "express";
import {
  getContracts,
  getActiveContracts,
  getContractById,
  getContractBySlug,
  addContract,
  updateContract,
  deleteContract,
  reorderContracts,
} from "../db/contracts";

// Get all contracts (admin)
export const getContractsHandler: RequestHandler = async (_req, res) => {
  try {
    const contracts = await getContracts();
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Get active contracts (public, ?locale=en)
export const getActiveContractsHandler: RequestHandler = async (req, res) => {
  try {
    const locale = req.query.locale === "en" ? "en" : undefined;
    const contracts = await getActiveContracts(locale);
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Get contract by ID (admin)
export const getContractByIdHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const contract = await getContractById(id);
    
    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Get contract by slug (public, ?locale=en)
export const getContractBySlugHandler: RequestHandler = async (req, res) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const locale = req.query.locale === "en" ? "en" : undefined;
    const contract = await getContractBySlug(slug, locale);

    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Add contract (title_en, content_en optional)
export const addContractHandler: RequestHandler = async (req, res) => {
  try {
    const { slug, title, title_en, content, content_en, isActive = true, order = 1 } = req.body;

    if (!slug || !title || !content) {
      res.status(400).json({ error: "slug, title and content are required" });
      return;
    }

    const contract = await addContract({ slug, title, title_en, content, content_en, isActive, order });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update contract
export const updateContractHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const contract = await updateContract(id, req.body);
    
    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Delete contract
export const deleteContractHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const success = await deleteContract(id);
    
    if (!success) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Reorder contracts
export const reorderContractsHandler: RequestHandler = async (req, res) => {
  try {
    const { contractIds } = req.body;
    
    if (!Array.isArray(contractIds)) {
      res.status(400).json({ error: "contractIds must be an array" });
      return;
    }
    
    const contracts = await reorderContracts(contractIds);
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};






