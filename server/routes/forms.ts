import { RequestHandler } from "express";
import {
  getFormResponses,
  getFormResponseById,
  getFormStats,
  deleteFormResponse,
  importFormResponses,
  clearFormResponses,
  addFormResponse,
  updateFormResponseData,
} from "../db/forms";
import { parseFormCSV } from "../utils/csvParser";
import { sendRegistrationEmail, RegistrationEmailData, sendStarsOfRegionsEmail } from "../utils/email";
import { STARS_OF_REGIONS_APPLICATION_CLOSED } from "../../shared/formFlags";

// GET /api/forms/stats
export const getStats: RequestHandler = async (_req, res) => {
  try {
    const stats = await getFormStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "İstatistikler alınırken bir hata oluştu" });
  }
};

// GET /api/forms/responses
export const getResponses: RequestHandler = async (req, res) => {
  try {
    const formTypeParam = req.query.formType;
    const formType = typeof formTypeParam === 'string' 
      ? formTypeParam 
      : Array.isArray(formTypeParam) && formTypeParam.length > 0 && typeof formTypeParam[0] === 'string'
      ? formTypeParam[0]
      : undefined;
    const responses = await getFormResponses(formType);
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: "Yanıtlar alınırken bir hata oluştu" });
  }
};

// GET /api/forms/responses/:id
export const getResponse: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const response = await getFormResponseById(id);
    
    if (!response) {
      res.status(404).json({ error: "Response not found" });
      return;
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Yanıt alınırken bir hata oluştu" });
  }
};

// PATCH /api/forms/responses/:id - data alanını kısmen günceller (örn. paymentStatus)
export const patchResponse: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const body = req.body as Record<string, unknown>;
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Geçerli bir id gerekli" });
      return;
    }
    const allowedKeys = ["paymentStatus", "iyzicoError"];
    const dataUpdate: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (key in body) dataUpdate[key] = body[key];
    }
    if (Object.keys(dataUpdate).length === 0) {
      res.status(400).json({ error: "Güncellenecek alan gerekli (paymentStatus, iyzicoError)" });
      return;
    }
    if (dataUpdate.paymentStatus !== undefined) {
      const v = dataUpdate.paymentStatus as string;
      if (!["success", "pending", "failed"].includes(v)) {
        res.status(400).json({ error: "paymentStatus: success, pending veya failed olmalı" });
        return;
      }
    }
    const updated = await updateFormResponseData(id, dataUpdate);
    if (!updated) {
      res.status(404).json({ error: "Kayıt bulunamadı" });
      return;
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Yanıt güncellenirken bir hata oluştu" });
  }
};

// DELETE /api/forms/responses/:id
export const deleteResponse: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const deleted = await deleteFormResponse(id);
    
    if (!deleted) {
      res.status(404).json({ error: "Response not found" });
      return;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Yanıt silinirken bir hata oluştu" });
  }
};

// POST /api/forms/import-csv
export const importCSV: RequestHandler = async (req, res) => {
  try {
    const { csvPath, formType, formName, clearExisting } = req.body;
    
    if (!csvPath || !formType || !formName) {
      res.status(400).json({ error: "csvPath, formType, and formName are required" });
      return;
    }
    
    if (clearExisting) {
      await clearFormResponses(formType);
    }
    
    const parsed = parseFormCSV(csvPath, formType, formName);
    const count = await importFormResponses(parsed);
    
    res.json({
      success: true,
      imported: count,
      formType,
      formName,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// DELETE /api/forms/clear
export const clearResponses: RequestHandler = async (req, res) => {
  try {
    const formTypeParam = req.query.formType;
    const formType = typeof formTypeParam === 'string' 
      ? formTypeParam 
      : Array.isArray(formTypeParam) && formTypeParam.length > 0 && typeof formTypeParam[0] === 'string'
      ? formTypeParam[0]
      : undefined;
    const count = await clearFormResponses(formType);
    res.json({ success: true, deleted: count });
  } catch (error) {
    res.status(500).json({ error: "Yanıtlar temizlenirken bir hata oluştu" });
  }
};

// POST /api/forms/submit
export const submitForm: RequestHandler = async (req, res) => {
  try {
    const { formType, formName, data } = req.body;
    
    if (!formType || !formName || !data) {
      res.status(400).json({ error: "formType, formName, and data are required" });
      return;
    }

    if (formType === "stars-of-regions" && STARS_OF_REGIONS_APPLICATION_CLOSED) {
      res.status(403).json({ error: "Stars of Region başvuruları süresi dolmuştur." });
      return;
    }
    
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const submittedAt = new Date().toISOString();
    
    const response = await addFormResponse({
      formType,
      formName,
      data,
      ipAddress,
      submittedAt,
    });
    
    // Eğer kayıt formu ise email gönder
    if (formType === "kayit" && data.eposta) {
      try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
          const emailData: RegistrationEmailData = {
            packageTitle: data.packageTitle || "",
            packageSubtitle: data.packageSubtitle || "",
            packagePrice: data.packagePrice || "",
            paymentMethod: data.paymentMethod || "",
            invoiceType: data.invoiceType || "",
            isEFatura: data.isEFatura || false,
            adSoyad: data.adSoyad || "",
            kurumAdi: data.kurumAdi || "",
            unvan: data.unvan || "",
            kurumAdresi: data.kurumAdresi || "",
            telefon: data.telefon || "",
            eposta: data.eposta || "",
            ceptel: data.ceptel || "",
            asistanAdSoyad: data.asistanAdSoyad || "",
            asistanEposta: data.asistanEposta || "",
            asistanTelefon: data.asistanTelefon || "",
            adSoyad2: data.adSoyad2 || "",
            kurumAdi2: data.kurumAdi2 || "",
            unvan2: data.unvan2 || "",
            kurumAdresi2: data.kurumAdresi2 || "",
            telefon2: data.telefon2 || "",
            eposta2: data.eposta2 || "",
            ceptel2: data.ceptel2 || "",
            firmaUnvani: data.firmaUnvani || "",
            faturaSehir: data.faturaSehir || "",
            faturaIlce: data.faturaIlce || "",
            faturaAdres: data.faturaAdres || "",
            faturaPostaKodu: data.faturaPostaKodu || "",
            vergiDairesi: data.vergiDairesi || "",
            vergiNo: data.vergiNo || "",
            eArsivEmail: data.eArsivEmail || "",
            tcKimlik: data.tcKimlik || "",
            ilgiliKisi: data.ilgiliKisi || "",
            sahisFaturaSehir: data.sahisFaturaSehir || "",
            sahisFaturaIlce: data.sahisFaturaIlce || "",
            sahisFaturaAdres: data.sahisFaturaAdres || "",
            sahisFaturaPostaKodu: data.sahisFaturaPostaKodu || "",
            sahisEposta: data.sahisEposta || "",
          };
          
          await sendRegistrationEmail(emailData);
        }
      } catch (emailError) {
        // Email hatası olsa bile form kaydı başarılı sayılır
      }
    }

    // Stars of Region: formu doldurana ve uez@bigmedia.com.tr (BCC) "Kaydınız başarılı" maili
    const starsEmail = (data && typeof data === "object" && (data.eposta ?? data.email))
      ? String(data.eposta ?? data.email).trim()
      : "";
    if (formType === "stars-of-regions" && starsEmail) {
      try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
          await sendStarsOfRegionsEmail({ ...data, eposta: starsEmail });
        } else {
          console.warn("[StarsOfRegions] E-posta gönderilmedi: SMTP ayarları eksik.");
        }
      } catch (emailError) {
        console.error("[StarsOfRegions] E-posta gönderilirken hata:", emailError);
      }
    }
    
    res.json({
      success: true,
      id: response.id,
      message: "Form başarıyla gönderildi!",
    });
  } catch (error) {
    res.status(500).json({
      error: "Form gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
    });
  }
};






