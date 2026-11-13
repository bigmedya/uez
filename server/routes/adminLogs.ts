import { RequestHandler } from "express";
import { 
  getAdminLogs, 
  getUserLogs, 
  getLogStats, 
  createAdminLog, 
  getClientIP,
  LOG_ACTIONS,
  LOG_ENTITIES 
} from "../utils/adminLogger";

// Admin loglarını listeleme
export const getLogsHandler: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as string;
    const entity = req.query.entity as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await getAdminLogs(page, limit, {
      userId,
      action,
      entity,
      startDate,
      endDate,
    });

    // Bu işlemi de loglayalım - şimdilik skip ediyoruz
    // TODO: Session-based authentication ile user ID'yi al

    res.json(result);
  } catch (error) {
    console.error("Admin logları alınırken hata:", error);
    res.status(500).json({ error: "Loglar alınırken bir hata oluştu" });
  }
};

// Belirli kullanıcının logları
export const getUserLogsHandler: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Geçersiz kullanıcı ID" });
    }

    const result = await getUserLogs(userId, page, limit);

    // Bu işlemi de loglayalım - şimdilik skip ediyoruz
    // TODO: Session-based authentication ile user ID'yi al

    res.json(result);
  } catch (error) {
    console.error("Kullanıcı logları alınırken hata:", error);
    res.status(500).json({ error: "Kullanıcı logları alınırken bir hata oluştu" });
  }
};

// Log istatistikleri
export const getLogStatsHandler: RequestHandler = async (req, res) => {
  try {
    const stats = await getLogStats();

    // Bu işlemi de loglayalım - şimdilik skip ediyoruz
    // TODO: Session-based authentication ile user ID'yi al

    res.json(stats);
  } catch (error) {
    console.error("Log istatistikleri alınırken hata:", error);
    res.status(500).json({ error: "İstatistikler alınırken bir hata oluştu" });
  }
};

// Manuel log oluşturma (test amaçlı)
export const createLogHandler: RequestHandler = async (req, res) => {
  try {
    const { action, entity, entityId, details } = req.body;

    if (!action || !entity) {
      return res.status(400).json({ error: "Action ve entity alanları gerekli" });
    }

    // Şimdilik test için sabit user ID kullan
    await createAdminLog({
      userId: 1, // TODO: Session-based authentication ile gerçek user ID'yi al
      action,
      entity,
      entityId,
      details,
      ipAddress: getClientIP(req),
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, message: "Log başarıyla oluşturuldu" });
  } catch (error) {
    console.error("Log oluşturulurken hata:", error);
    res.status(500).json({ error: "Log oluşturulurken bir hata oluştu" });
  }
};