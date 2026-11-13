import { RequestHandler } from "express";
import { getUTMStats, getUTMRegistrations } from "../db/forms";

/**
 * GET /api/utm-analytics/stats - UTM kampanya istatistikleri
 */
export const getUTMStatsHandler: RequestHandler = async (req, res) => {
  try {
    const stats = await getUTMStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("UTM stats error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "UTM istatistikleri alınamadı",
    });
  }
};

/**
 * GET /api/utm-analytics/registrations?utm_source=X&utm_campaign=Y
 * Belirli UTM kampanyasının kayıtları
 */
export const getUTMRegistrationsHandler: RequestHandler = async (req, res) => {
  try {
    const utmSource = req.query.utm_source as string;
    const utmCampaign = req.query.utm_campaign as string;

    if (!utmSource) {
      res.status(400).json({
        success: false,
        error: "utm_source parametresi gerekli",
      });
      return;
    }

    const registrations = await getUTMRegistrations(utmSource, utmCampaign);
    res.json({ success: true, registrations });
  } catch (error) {
    console.error("UTM registrations error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "UTM kayıtları alınamadı",
    });
  }
};

/**
 * GET /api/utm-analytics/summary - UTM özet raporu
 */
export const getUTMSummaryHandler: RequestHandler = async (req, res) => {
  try {
    const stats = await getUTMStats();
    
    // Genel özet istatistikleri
    const summary = {
      total_utm_campaigns: stats.length,
      total_utm_registrations: stats.reduce((sum, s) => sum + s.total_registrations, 0),
      total_utm_paid: stats.reduce((sum, s) => sum + s.paid_registrations, 0),
      total_utm_revenue: stats.reduce((sum, s) => sum + (s.total_revenue || 0), 0),
      avg_conversion_rate: stats.length > 0 
        ? stats.reduce((sum, s) => sum + s.conversion_rate, 0) / stats.length 
        : 0,
      top_sources: stats
        .sort((a, b) => b.total_registrations - a.total_registrations)
        .slice(0, 5)
        .map(s => ({
          utm_source: s.utm_source,
          utm_campaign: s.utm_campaign,
          total_registrations: s.total_registrations,
          conversion_rate: s.conversion_rate,
        })),
    };

    res.json({ success: true, summary });
  } catch (error) {
    console.error("UTM summary error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "UTM özeti alınamadı",
    });
  }
};