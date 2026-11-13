import { RequestHandler } from "express";
import {
  getProgramData,
  getProgramDataForHomepage,
  getProgramDataByYear,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getDays,
  getDay,
  addDay,
  updateDay,
  deleteDay,
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  reorderScheduleItems,
  clearProgram,
  linkSpeakersToProgram,
  importProgramData,
} from "../db/program";
import type { ScheduleItem } from "../db/program";
import { importScheduleFromXML } from "../utils/programXmlParser";
import { getSpeakers } from "../db/speakers";
import { sendNotification } from "../services/onesignal";
import {
  programNotificationTemplates,
  replacePlaceholders,
} from "../config/notificationMessages";

// Get all program data (year filter, ?locale=en; ?forAdmin=1 returns raw days/items with _en for admin panel)
export const getProgramHandler: RequestHandler = async (req, res) => {
  try {
    const yearParam = req.query.year as string | undefined;
    const locale = req.query.locale === "en" ? "en" : undefined;
    const forAdmin = req.query.forAdmin === "1";

    if (forAdmin) {
      const [categories, days] = await Promise.all([getCategories(), getDays()]);
      res.json({ categories, days, updatedAt: new Date().toISOString() });
      return;
    }

    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (isNaN(year)) {
        res.status(400).json({ error: "Invalid year parameter" });
        return;
      }
      const data = await getProgramDataByYear(year, locale);
      res.json(data);
    } else {
      const data = await getProgramData(locale);
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Get program data for homepage (?locale=en)
export const getProgramForHomepageHandler: RequestHandler = async (req, res) => {
  try {
    const locale = req.query.locale === "en" ? "en" : undefined;
    const data = await getProgramDataForHomepage(locale);
    res.json({ days: data.days });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Update all data (deprecated - use individual endpoints)
export const updateProgramHandler: RequestHandler = async (req, res) => {
  try {
    // This endpoint is kept for backward compatibility but doesn't do anything
    // Individual endpoints should be used instead
    res.json({ message: "Use individual endpoints to update program data" });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Categories
export const getCategoriesHandler: RequestHandler = async (_req, res) => {
  try {
    res.json(await getCategories());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

/** Programa konuşmacı eklendiğinde OneSignal bildirimi (fire-and-forget). */
function notifyProgramUpdate(
  title: string,
  message: string,
  data?: Record<string, unknown>
): void {
  sendNotification({
    title,
    message,
    segments: ["All"],
    data: data ? { ...data, source: "program_update" } : { source: "program_update" },
    language: "tr",
  }).catch((err) => console.error("[Program] OneSignal bildirimi atılamadı:", err));
}

/** Konuşmacı ID listesinden isim listesi döner (virgülle ayrılmış). */
async function getSpeakerNames(speakerIds: number[]): Promise<string> {
  if (!speakerIds?.length) return "";
  const speakers = await getSpeakers();
  const names = speakerIds
    .map((id) => speakers.find((s) => s.id === id)?.name)
    .filter(Boolean) as string[];
  return names.join(", ");
}

export const addCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const category = await addCategory(req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const category = await updateCategory(id, req.body);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const deleteCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
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

// Days
export const getDaysHandler: RequestHandler = async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    res.json(await getDays(categoryId));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getDayHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const day = await getDay(id);
    if (!day) {
      res.status(404).json({ error: "Day not found" });
      return;
    }
    res.json(day);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const addDayHandler: RequestHandler = async (req, res) => {
  try {
    console.log("addDayHandler - Request body:", req.body);
    const day = await addDay(req.body);
    res.json(day);
  } catch (error) {
    console.error("addDayHandler - Error:", error);
    res.status(500).json({ error: String(error), details: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const updateDayHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const day = await updateDay(id, req.body);
    if (!day) {
      res.status(404).json({ error: "Day not found" });
      return;
    }
    res.json(day);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const deleteDayHandler: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const success = await deleteDay(id);
    if (!success) {
      res.status(404).json({ error: "Day not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Schedule Items
export const addItemHandler: RequestHandler = async (req, res) => {
  try {
    const dayIdParam = req.params.dayId;
    console.log("addItemHandler - dayId param:", dayIdParam, "type:", typeof dayIdParam);
    
    if (!dayIdParam) {
      res.status(400).json({ error: "dayId parameter is required" });
      return;
    }
    
    const dayId = parseInt(Array.isArray(dayIdParam) ? dayIdParam[0] : dayIdParam);
    
    if (isNaN(dayId)) {
      res.status(400).json({ error: "Invalid dayId parameter" });
      return;
    }
    
    console.log("addItemHandler - parsed dayId:", dayId, "body:", req.body);
    const item = await addScheduleItem(dayId, req.body);

    if (!item) {
      res.status(404).json({ error: "Day not found" });
      return;
    }

    const titleTrim = String((item as ScheduleItem).title ?? "").trim();
    const time = (item as ScheduleItem).time ?? "";
    const fromItem = (item as ScheduleItem).speakerIds ?? ((item as ScheduleItem).speakerId != null ? [(item as ScheduleItem).speakerId!] : []);
    const fromBody = Array.isArray(req.body?.speakerIds) ? req.body.speakerIds : (req.body?.speakerId != null ? [req.body.speakerId] : []);
    const ids = (fromItem.length > 0 ? fromItem : fromBody).map((id) => (typeof id === "string" ? parseInt(id, 10) : id)).filter((id) => !Number.isNaN(id) && id > 0);
    if (ids.length > 0) {
      const speakerNames = await getSpeakerNames(ids);
      const t = programNotificationTemplates.speakerAdded;
      const messageTpl = titleTrim ? t.message : t.messageNoTitle;
      console.log("[Program] Konuşmacılı oturum eklendi, bildirim gönderiliyor:", { title: titleTrim, time, speakerNames });
      notifyProgramUpdate(
        replacePlaceholders(t.title, { title: titleTrim, time, speakerNames }),
        replacePlaceholders(messageTpl, { title: titleTrim, time, speakerNames }),
        { type: "speaker_added", itemId: String(item.id), dayId: String(dayId), title: titleTrim, time }
      );
    } else {
      const t = programNotificationTemplates.newItem;
      const messageTpl = titleTrim ? t.message : t.messageNoTitle;
      console.log("[Program] Yeni oturum eklendi, bildirim gönderiliyor:", { title: titleTrim, time });
      notifyProgramUpdate(
        replacePlaceholders(t.title, { title: titleTrim, time }),
        replacePlaceholders(messageTpl, { title: titleTrim, time }),
        { type: "new_item", itemId: String(item.id), dayId: String(dayId), title: titleTrim, time }
      );
    }
    res.json(item);
  } catch (error) {
    console.error("addItemHandler - Error:", error);
    res.status(500).json({ error: String(error), details: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const updateItemHandler: RequestHandler = async (req, res) => {
  try {
    const dayId = parseInt(Array.isArray(req.params.dayId) ? req.params.dayId[0] : req.params.dayId, 10);
    const itemId = parseInt(Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId, 10);
    
    if (Number.isNaN(dayId) || Number.isNaN(itemId)) {
      res.status(400).json({ error: "Invalid dayId or itemId" });
      return;
    }
    const hasSpeakerUpdate =
      Array.isArray(req.body?.speakerIds) ||
      (req.body?.speakerId !== undefined && req.body?.speakerId !== null);
    
    const item = await updateScheduleItem(dayId, itemId, req.body);
    if (!item) {
      res.status(404).json({ error: "Öğe bulunamadı. Sayfayı yenileyip tekrar deneyin.", code: "ITEM_NOT_FOUND" });
      return;
    }
    const ids = (item as ScheduleItem).speakerIds ?? ((item as ScheduleItem).speakerId ? [(item as ScheduleItem).speakerId!] : []);
    
    if (hasSpeakerUpdate && ids.length > 0) {
      const speakerNames = await getSpeakerNames(ids);
      const titleTrim = String((item as ScheduleItem).title ?? "").trim();
      const time = (item as ScheduleItem).time ?? "";
      const t = programNotificationTemplates.speakerAdded;
      const messageTpl = titleTrim ? t.message : t.messageNoTitle;
      notifyProgramUpdate(
        replacePlaceholders(t.title, { title: titleTrim, time, speakerNames }),
        replacePlaceholders(messageTpl, { title: titleTrim, time, speakerNames }),
        { type: "speaker_added", itemId: String(item.id), dayId: String(dayId), title: titleTrim, time }
      );
    }
    res.json(item);
  } catch (error) {
    console.error("[program] updateItem error:", error);
    res.status(500).json({ error: String(error) });
  }
};

export const deleteItemHandler: RequestHandler = async (req, res) => {
  try {
    const dayId = parseInt(Array.isArray(req.params.dayId) ? req.params.dayId[0] : req.params.dayId);
    const itemId = parseInt(Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId);
    const success = await deleteScheduleItem(dayId, itemId);
    if (!success) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const reorderItemsHandler: RequestHandler = async (req, res) => {
  try {
    const dayId = parseInt(Array.isArray(req.params.dayId) ? req.params.dayId[0] : req.params.dayId);
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      res.status(400).json({ error: "itemIds must be an array" });
      return;
    }
    const items = await reorderScheduleItems(dayId, itemIds);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Import from XML
export const importXMLHandler: RequestHandler = async (req, res) => {
  try {
    const { xmlPath, clearExisting } = req.body;
    if (!xmlPath) {
      res.status(400).json({ error: "xmlPath is required" });
      return;
    }
    
    const result = await importScheduleFromXML(xmlPath, clearExisting === true);
    res.json({
      success: true,
      imported: result.days,
      categories: result.categories,
      days: result.days,
      items: result.items,
      speakersMatched: result.speakersMatched,
      data: await getProgramData()
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Clear all program data
export const clearProgramHandler: RequestHandler = async (_req, res) => {
  try {
    await clearProgram();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

// Link WordPress speaker IDs to system speaker IDs
export const linkSpeakersHandler: RequestHandler = async (_req, res) => {
  try {
    // Get all speakers with wpPostId
    const speakers = await getSpeakers();
    
    // Build WordPress ID to System ID map (first occurrence takes priority)
    const wpToSystemMap = new Map<string, number>();
    for (const speaker of speakers) {
      if (speaker.wpPostId) {
        const wpIdStr = String(speaker.wpPostId);
        // Only add if not already in map (first speaker with this WP ID wins)
        if (!wpToSystemMap.has(wpIdStr)) {
          wpToSystemMap.set(wpIdStr, speaker.id);
        }
      }
    }
    
    // Link speakers to program
    const result = await linkSpeakersToProgram(wpToSystemMap);
    
    res.json({
      success: true,
      speakersInMap: wpToSystemMap.size,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

