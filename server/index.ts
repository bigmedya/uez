import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import type { Request } from "express";
import { injectSeoIntoIndexHtml } from "../shared/seo";

/** Canonical/OG linkler için public origin (proxy arkasında iç IP kullanılmaz). */
function getPublicOrigin(req: Request): string {
  const fromEnv = process.env.PUBLIC_ORIGIN || process.env.SITE_URL;
  if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host") || ""}`;
}

/** İstek URL'sinden pathname üretir (proxy/barındırma ortamında doğru canonical için). */
function getPathnameFromRequest(req: Request): string {
  const raw = (req.originalUrl ?? req.url ?? req.path ?? "").replace(/\?.*$/, "").trim();
  if (!raw || raw === "") return "/";
  // Ana sayfa dışındaki tüm URL'ler / (SEO sistemi ile uyumlu)
  if (raw === "/") return "/";
  return raw.endsWith("/") ? raw : raw + "/";
}
import { handleDemo } from "./routes/demo";
import {
  getAllSpeakers,
  getSpeaker,
  createSpeaker,
  updateSpeakerHandler,
  deleteSpeakerHandler,
  importSpeakersHandler,
  toggleSpeakerPinForYearHandler,
} from "./routes/speakers";
import {
  getUTMStatsHandler,
  getUTMRegistrationsHandler,
  getUTMSummaryHandler,
} from "./routes/utmAnalytics";
import { parseWordPressXML } from "./utils/xmlParser";
import { downloadAllSpeakerImages } from "./utils/downloadImages";
import { importSpeakers, clearSpeakers, getSpeakers } from "./db/speakers";
import {
  getStats,
  getResponses,
  getResponse,
  patchResponse,
  deleteResponse,
  importCSV,
  clearResponses,
  submitForm,
} from "./routes/forms";
import { checkoutInitialize, paymentCallback, processPayment, payment3dsCallback } from "./routes/payment";
import { uploadFile } from "./routes/upload";
import { uploadImage } from "./routes/imageUpload";
import {
  testOneSignalHandler,
  sendOneSignalNotification,
  getOneSignalStats,
  getOneSignalHistory,
  sendOneSignalTestNotification,
} from "./routes/onesignal-notifications";
import {
  getSettingsHandler,
  updateSettingsHandler,
  resetSettingsHandler,
} from "./routes/settings";
import {
  getArchiveDescription,
  getAllArchiveDescriptionsHandler,
  createOrUpdateArchiveDescription,
  deleteArchiveDescriptionHandler,
} from "./routes/archiveRoutes";
import {
  getHomepageHandler,
  updateHomepageHandler,
  updateHeroHandler,
  updateCountersHandler,
  updateInfoBannerHandler,
} from "./routes/homepage";
import {
  getSponsorsHandler,
  getCategoriesHandler,
  addCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  reorderCategoriesHandler,
  addSponsorHandler,
  updateSponsorHandler,
  deleteSponsorHandler,
  moveSponsorHandler,
  reorderSponsorsHandler,
} from "./routes/sponsorRoutes";
import { downloadAllSponsorImages } from "./utils/downloadSponsorImages";
import { migrateSponsorsFromJson } from "./utils/migrateSponsors";
import {
  getFAQHandler,
  getActiveFAQHandler,
  addFAQHandler,
  updateFAQHandler,
  deleteFAQHandler,
  reorderFAQHandler,
} from "./routes/faqRoutes";
import {
  getUEZ2026Handler,
  getPublicUEZ2026Handler,
  updateUEZ2026Handler,
  updateHeroHandler as updateUEZ2026HeroHandler,
  updateIntroHandler,
  updateTopicsSectionHandler,
  addTopicHandler,
  updateTopicHandler,
  deleteTopicHandler,
  reorderTopicsHandler,
} from "./routes/uez2026Routes";
import {
  getAboutHandler,
  updateAboutHandler,
  updateAboutHeroHandler,
  addSectionHandler,
  updateSectionHandler,
  deleteSectionHandler,
  reorderSectionsHandler,
} from "./routes/aboutRoutes";
import {
  getContactHandler,
  updateContactHandler,
  updateContactHeroHandler,
  updateInfoSectionHandler,
  updateFormSectionHandler,
  updateMapSectionHandler,
  addContactCardHandler,
  updateContactCardHandler,
  deleteContactCardHandler,
  reorderContactCardsHandler,
} from "./routes/contactRoutes";
import { sendContactEmailHandler } from "./routes/contactForm";
import {
  getContractsHandler,
  getActiveContractsHandler,
  getContractByIdHandler,
  getContractBySlugHandler,
  addContractHandler,
  updateContractHandler,
  deleteContractHandler,
  reorderContractsHandler,
} from "./routes/contractRoutes";
import {
  getPackagesHandler,
  getPackageHandler,
  createPackageHandler,
  updatePackageHandler,
  deletePackageHandler,
} from "./routes/packageRoutes";
import {
  getMobilePageHandler,
  updateMobilePageHandler,
} from "./routes/mobilePageRoutes";
import { login as loginHandler, logout as logoutHandler } from "./routes/auth";
import { 
  getLogsHandler, 
  getUserLogsHandler, 
  getLogStatsHandler, 
  createLogHandler 
} from "./routes/adminLogs";
import {
  getRegistrationExternalPaymentHandler,
  getRegistrationExternalPaymentHistoryHandler,
  putRegistrationExternalPaymentHandler,
  deleteRegistrationExternalPaymentEntryHandler,
} from "./routes/registrationExternalPayment";
import { authenticateToken, requireAdmin } from "./middleware/auth";
import {
  getRolesHandler,
  getRoleHandler,
  getPermissionKeysHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
} from "./routes/roles";
import { getAdminUsersHandler, setUserRoleHandler, createAdminUserHandler } from "./routes/adminUsers";
import {
  getProgramHandler,
  getProgramForHomepageHandler,
  updateProgramHandler,
  getCategoriesHandler as getProgramCategoriesHandler,
  addCategoryHandler as addProgramCategoryHandler,
  updateCategoryHandler as updateProgramCategoryHandler,
  deleteCategoryHandler as deleteProgramCategoryHandler,
  getDaysHandler,
  getDayHandler,
  addDayHandler,
  updateDayHandler,
  deleteDayHandler,
  addItemHandler,
  updateItemHandler,
  deleteItemHandler,
  reorderItemsHandler,
  importXMLHandler,
  clearProgramHandler,
  linkSpeakersHandler,
} from "./routes/programRoutes";
import { startProgramStartReminderScheduler } from "./services/programStartReminders";

export interface CreateServerOptions {
  skipHtmlFallback?: boolean;
}

export function createServer(options?: CreateServerOptions) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  
  // Serve static files from public directory
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
  // Konuşmacı resimleri: uzun süreli cache (30 gün) ile hızlı yükleme
  app.use(
    "/speakers",
    express.static(path.join(process.cwd(), "public", "speakers"), {
      maxAge: "30d",
      immutable: false,
    })
  );

  // Production: static + SPA fallback — skipHtmlFallback true ise HTML'i node-build SSR'a bırak
  if (process.env.NODE_ENV === "production" && !options?.skipHtmlFallback) {
    // Serve assets from public/assets (copied from dist/spa/assets)
    app.use("/assets", express.static(path.join(process.cwd(), "public", "assets")));
    // Serve other static files from dist/spa
    app.use(express.static(path.join(process.cwd(), "dist", "spa")));
    // SPA fallback - serve index.html with path-based title/meta (kaynak kod + botlar doğru head görsün)
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/assets/")) {
        return next();
      }
      const indexPath = path.join(process.cwd(), "dist", "spa", "index.html");
      let html: string;
      try {
        html = fs.readFileSync(indexPath, "utf-8");
      } catch {
        return next();
      }
      const origin = getPublicOrigin(req);
      const pathname = getPathnameFromRequest(req);
      html = injectSeoIntoIndexHtml(html, pathname, origin);
      res.set("Content-Type", "text/html").send(html);
    });
  }

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/logout", logoutHandler);

  // Admin Logs Routes
  app.get("/api/admin/logs", getLogsHandler);
  app.get("/api/admin/logs/user/:userId", getUserLogsHandler);
  app.get("/api/admin/logs/stats", getLogStatsHandler);
  app.post("/api/admin/logs", createLogHandler);
  app.get("/api/admin/registration-external-payment", authenticateToken, getRegistrationExternalPaymentHandler);
  app.get(
    "/api/admin/registration-external-payment/history",
    authenticateToken,
    getRegistrationExternalPaymentHistoryHandler
  );
  app.put("/api/admin/registration-external-payment", authenticateToken, putRegistrationExternalPaymentHandler);
  app.post("/api/admin/registration-external-payment", authenticateToken, putRegistrationExternalPaymentHandler);
  app.delete(
    "/api/admin/registration-external-payment/entries/:id",
    authenticateToken,
    deleteRegistrationExternalPaymentEntryHandler
  );

  // Admin rol / yetki
  app.get("/api/admin/roles", getRolesHandler);
  app.get("/api/admin/roles/permission-keys", getPermissionKeysHandler);
  app.get("/api/admin/roles/:id", getRoleHandler);
  app.post("/api/admin/roles", createRoleHandler);
  app.put("/api/admin/roles/:id", updateRoleHandler);
  app.delete("/api/admin/roles/:id", deleteRoleHandler);

  app.get("/api/admin/users", getAdminUsersHandler);
  app.post("/api/admin/users", createAdminUserHandler);
  app.put("/api/admin/users/:id/role", setUserRoleHandler);

  // Speaker routes
  app.get("/api/speakers", getAllSpeakers);
  app.get("/api/speakers/:id", getSpeaker);
  app.post("/api/speakers", createSpeaker);
  app.put("/api/speakers/:id", updateSpeakerHandler);
  app.delete("/api/speakers/:id", deleteSpeakerHandler);
  app.post("/api/speakers/:id/toggle-pin/:year", toggleSpeakerPinForYearHandler);
  app.post("/api/speakers/import", importSpeakersHandler);

  // Import from WordPress XML file
  app.post("/api/speakers/import-xml", async (req, res) => {
    try {
      const { xmlPath, clearExisting } = req.body;
      
      if (!xmlPath) {
        res.status(400).json({ error: "xmlPath is required" });
        return;
      }

      if (clearExisting) {
        await clearSpeakers();
      }

      const parsedSpeakers = parseWordPressXML(xmlPath);
      const count = await importSpeakers(parsedSpeakers);

      res.json({ 
        success: true, 
        imported: count,
        speakers: await getSpeakers()
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Download all speaker images to local server
  app.post("/api/speakers/download-images", async (_req, res) => {
    try {
      const result = await downloadAllSpeakerImages();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Form response routes
  app.get("/api/forms/stats", getStats);
  app.get("/api/forms/responses", getResponses);
  app.get("/api/forms/responses/:id", getResponse);
  app.patch("/api/forms/responses/:id", patchResponse);
  app.delete("/api/forms/responses/:id", deleteResponse);
  app.post("/api/forms/import-csv", importCSV);
  app.post("/api/forms/submit", submitForm);
  app.post("/api/forms/upload", uploadFile);
  app.delete("/api/forms/clear", clearResponses);

  // UTM Analytics routes
  app.get("/api/utm-analytics/stats", getUTMStatsHandler);
  app.get("/api/utm-analytics/registrations", getUTMRegistrationsHandler);
  app.get("/api/utm-analytics/summary", getUTMSummaryHandler);

  // iyzico ödeme (kart bilgisi sitede alınır, ödeme sunucuda iyzico ile)
  app.post("/api/payment/process", processPayment);
  app.post("/api/payment/checkout-initialize", checkoutInitialize);
  app.get("/api/payment/callback", paymentCallback);
  app.post("/api/payment/callback", paymentCallback);
  app.get("/api/payment/3ds-callback", payment3dsCallback);
  app.post("/api/payment/3ds-callback", payment3dsCallback);

  // Image upload route
  app.post("/api/images/upload", uploadImage);

  // Site settings routes
  app.get("/api/settings", getSettingsHandler);
  app.put("/api/settings", updateSettingsHandler);
  app.post("/api/settings/reset", resetSettingsHandler);

  // Homepage routes
  app.get("/api/homepage", getHomepageHandler);
  app.put("/api/homepage", updateHomepageHandler);
  app.put("/api/homepage/hero", updateHeroHandler);
  app.put("/api/homepage/counters", updateCountersHandler);
  app.put("/api/homepage/info-banner", updateInfoBannerHandler);

  // Sponsors routes
  app.get("/api/sponsors", getSponsorsHandler);
  app.post("/api/sponsors/migrate", async (_req, res) => {
    try {
      await migrateSponsorsFromJson();
      res.json({ success: true, message: "Migration completed" });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app.get("/api/sponsors/categories", getCategoriesHandler);
  app.post("/api/sponsors/categories", addCategoryHandler);
  app.put("/api/sponsors/categories/:id", updateCategoryHandler);
  app.delete("/api/sponsors/categories/:id", deleteCategoryHandler);
  app.post("/api/sponsors/categories/reorder", reorderCategoriesHandler);
  app.post("/api/sponsors/categories/:categoryId/sponsors", addSponsorHandler);
  app.post("/api/sponsors/categories/:categoryId/sponsors/reorder", reorderSponsorsHandler);
  app.put("/api/sponsors/sponsor/:id", updateSponsorHandler);
  app.delete("/api/sponsors/sponsor/:id", deleteSponsorHandler);
  app.post("/api/sponsors/sponsor/:id/move", moveSponsorHandler);
  app.post("/api/sponsors/download-images", async (_req, res) => {
    try {
      const result = await downloadAllSponsorImages();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // FAQ routes
  app.get("/api/faq", getFAQHandler);
  app.get("/api/faq/active", getActiveFAQHandler);
  app.post("/api/faq", addFAQHandler);
  app.put("/api/faq/:id", updateFAQHandler);
  app.delete("/api/faq/:id", deleteFAQHandler);
  app.post("/api/faq/reorder", reorderFAQHandler);

  // UEZ 2026 routes
  app.get("/api/uez2026", getUEZ2026Handler);
  app.get("/api/uez2026/public", getPublicUEZ2026Handler);
  app.put("/api/uez2026", updateUEZ2026Handler);
  app.put("/api/uez2026/hero", updateUEZ2026HeroHandler);
  app.put("/api/uez2026/intro", updateIntroHandler);
  app.put("/api/uez2026/topics-section", updateTopicsSectionHandler);
  app.post("/api/uez2026/topics", addTopicHandler);
  app.put("/api/uez2026/topics/:id", updateTopicHandler);
  app.delete("/api/uez2026/topics/:id", deleteTopicHandler);
  app.post("/api/uez2026/topics/reorder", reorderTopicsHandler);

  // About routes
  app.get("/api/about", getAboutHandler);
  app.put("/api/about", updateAboutHandler);
  app.put("/api/about/hero", updateAboutHeroHandler);
  app.post("/api/about/sections", addSectionHandler);
  app.put("/api/about/sections/:id", updateSectionHandler);
  app.delete("/api/about/sections/:id", deleteSectionHandler);
  app.post("/api/about/sections/reorder", reorderSectionsHandler);

  // Contact routes
  app.get("/api/contact", getContactHandler);
  app.put("/api/contact", updateContactHandler);
  app.put("/api/contact/hero", updateContactHeroHandler);
  app.put("/api/contact/info-section", updateInfoSectionHandler);
  app.put("/api/contact/form-section", updateFormSectionHandler);
  app.put("/api/contact/map-section", updateMapSectionHandler);
  app.post("/api/contact/cards", addContactCardHandler);
  app.put("/api/contact/cards/:id", updateContactCardHandler);
  app.delete("/api/contact/cards/:id", deleteContactCardHandler);
  app.post("/api/contact/cards/reorder", reorderContactCardsHandler);
  
  // Contact form submission
  app.post("/api/contact/send", sendContactEmailHandler);

  // Contract routes
  app.get("/api/contracts", getContractsHandler);
  app.get("/api/contracts/active", getActiveContractsHandler);
  app.get("/api/contracts/slug/:slug", getContractBySlugHandler);
  app.get("/api/contracts/:id", getContractByIdHandler);
  app.post("/api/contracts", addContractHandler);
  app.put("/api/contracts/:id", updateContractHandler);
  app.delete("/api/contracts/:id", deleteContractHandler);
  app.post("/api/contracts/reorder", reorderContractsHandler);

  // Program routes
  app.get("/api/program", getProgramHandler);
  app.get("/api/program/homepage", getProgramForHomepageHandler);
  app.put("/api/program", updateProgramHandler);
  app.get("/api/program/categories", getProgramCategoriesHandler);
  app.post("/api/program/categories", addProgramCategoryHandler);
  app.put("/api/program/categories/:id", updateProgramCategoryHandler);
  app.delete("/api/program/categories/:id", deleteProgramCategoryHandler);
  app.get("/api/program/days", getDaysHandler);
  app.get("/api/program/days/:id", getDayHandler);
  app.post("/api/program/days", addDayHandler);
  app.put("/api/program/days/:id", updateDayHandler);
  app.delete("/api/program/days/:id", deleteDayHandler);
  app.post("/api/program/days/:dayId/items", addItemHandler);
  app.put("/api/program/days/:dayId/items/:itemId", updateItemHandler);
  app.delete("/api/program/days/:dayId/items/:itemId", deleteItemHandler);
  app.post("/api/program/days/:dayId/items/reorder", reorderItemsHandler);
  app.post("/api/program/import-xml", importXMLHandler);
  app.post("/api/program/link-speakers", linkSpeakersHandler);
  app.delete("/api/program/clear", clearProgramHandler);

  // Package routes
  app.get("/api/packages", getPackagesHandler);
  app.get("/api/packages/:id", getPackageHandler);
  app.post("/api/packages", createPackageHandler);

  // OneSignal Notification routes
  app.get("/api/onesignal/test", testOneSignalHandler);
  app.post("/api/onesignal/send", sendOneSignalNotification);
  app.get("/api/onesignal/stats", getOneSignalStats);
  app.get("/api/onesignal/history", getOneSignalHistory);
  app.post("/api/onesignal/test-notification", sendOneSignalTestNotification);
  app.put("/api/packages/:id", updatePackageHandler);
  app.delete("/api/packages/:id", deletePackageHandler);

  // Mobile page routes
  app.get("/api/mobile-page", getMobilePageHandler);
  app.put("/api/mobile-page", updateMobilePageHandler);

  // Archive routes
  app.get("/api/archive", getAllArchiveDescriptionsHandler);
  app.get("/api/archive/:year", getArchiveDescription);
  app.post("/api/archive", createOrUpdateArchiveDescription);
  app.delete("/api/archive/:year", deleteArchiveDescriptionHandler);

  // Dev: işlenmeyen istekleri Vite'a ilet (SPA index.html ve asset'ler için)
  if (process.env.NODE_ENV !== "production") {
    app.use((_req, _res, next) => next());
  }

  startProgramStartReminderScheduler();

  return app;
}
