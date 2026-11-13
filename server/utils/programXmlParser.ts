import fs from "fs";
import path from "path";
import { ScheduleDay, ScheduleItem, ScheduleCategory, importProgramData, addCategory } from "../db/program";
import { getSpeakers } from "../db/speakers";

// Build a mapping from WordPress post ID to our speaker ID
async function buildWpToLocalSpeakerMap(): Promise<Map<string, number>> {
  const speakers = await getSpeakers();
  const map = new Map<string, number>();
  
  for (const speaker of speakers) {
    if (speaker.wpPostId) {
      map.set(String(speaker.wpPostId), speaker.id);
    }
  }
  
  return map;
}

interface ParsedSchedule {
  categories: ScheduleCategory[];
  days: ScheduleDay[];
}

interface ParsedScheduleItem {
  schedule_time: string;
  schedule_title: string;
  schedule_note: string;
  speakers: string; // Single speaker WP post ID
  isMultiSpeaker: boolean;
  multiSpeakerIds: string[]; // Multi speaker WP post IDs
}

// Parse PHP serialized string - improved to extract speaker data
function parsePhpSerialized(str: string): { schedule_day: string; exhibz_schedule_pop_up: ParsedScheduleItem[] } {
  try {
    const result: { schedule_day: string; exhibz_schedule_pop_up: ParsedScheduleItem[] } = {
      schedule_day: "",
      exhibz_schedule_pop_up: []
    };
    
    // Match schedule_day
    const scheduleDayMatch = str.match(/s:12:"schedule_day";s:(\d+):"([^"]*)"/);
    if (scheduleDayMatch) {
      result.schedule_day = scheduleDayMatch[2];
    }
    
    // Split by schedule items - each item starts with schedule_time
    // Pattern: a:5:{s:13:"schedule_time";...}
    const itemPattern = /a:5:\{s:13:"schedule_time";s:\d+:"([^"]*)";s:8:"speakers";s:\d+:"([^"]*)";s:20:"multi_speaker_choose";a:2:\{s:5:"style";s:\d+:"([^"]*)";s:3:"yes";a:1:\{s:14:"multi_speakers";(a:\d+:\{[^}]*\}|a:0:\{\})\}\}s:14:"schedule_title";s:\d+:"([^"]*)";s:13:"schedule_note";s:\d+:"([^"]*)"/g;
    
    let match;
    while ((match = itemPattern.exec(str)) !== null) {
      const time = match[1] || "";
      const singleSpeaker = match[2] || "";
      const multiStyle = match[3] || "no";
      const multiSpeakersRaw = match[4] || "a:0:{}";
      const title = match[5] || "";
      const note = match[6] || "";
      
      // Extract multi speaker IDs from the array
      const multiSpeakerIds: string[] = [];
      const speakerIdMatches = [...multiSpeakersRaw.matchAll(/s:\d+:"(\d+)"/g)];
      for (const m of speakerIdMatches) {
        if (m[1]) multiSpeakerIds.push(m[1]);
      }
      
      result.exhibz_schedule_pop_up.push({
        schedule_time: time,
        schedule_title: title,
        schedule_note: note,
        speakers: singleSpeaker,
        isMultiSpeaker: multiStyle === "yes",
        multiSpeakerIds: multiSpeakerIds
      });
    }
    
    // Fallback: if no items found with the complex pattern, use simpler extraction
    if (result.exhibz_schedule_pop_up.length === 0) {
      const timeMatches = [...str.matchAll(/s:13:"schedule_time";s:\d+:"([^"]*)"/g)];
      const titleMatches = [...str.matchAll(/s:14:"schedule_title";s:\d+:"([^"]*)"/g)];
      const noteMatches = [...str.matchAll(/s:13:"schedule_note";s:\d+:"([^"]*)"/g)];
      const speakerMatches = [...str.matchAll(/s:8:"speakers";s:\d+:"([^"]*)"/g)];
      const styleMatches = [...str.matchAll(/s:20:"multi_speaker_choose";a:2:\{s:5:"style";s:\d+:"([^"]*)"/g)];
      
      // Extract multi_speakers arrays
      const multiSpeakerArrays: string[][] = [];
      const multiPattern = /s:14:"multi_speakers";(a:\d+:\{[^}]*\}|a:0:\{\})/g;
      let multiMatch;
      while ((multiMatch = multiPattern.exec(str)) !== null) {
        const ids: string[] = [];
        const idMatches = [...(multiMatch[1] || "").matchAll(/s:\d+:"(\d+)"/g)];
        for (const m of idMatches) {
          if (m[1]) ids.push(m[1]);
        }
        multiSpeakerArrays.push(ids);
      }
      
      for (let i = 0; i < timeMatches.length; i++) {
        result.exhibz_schedule_pop_up.push({
          schedule_time: timeMatches[i]?.[1] || "",
          schedule_title: titleMatches[i]?.[1] || "",
          schedule_note: noteMatches[i]?.[1] || "",
          speakers: speakerMatches[i]?.[1] || "",
          isMultiSpeaker: styleMatches[i]?.[1] === "yes",
          multiSpeakerIds: multiSpeakerArrays[i] || []
        });
      }
    }
    
    return result;
  } catch (e) {
    console.error("Error parsing PHP serialized string:", e);
    return { schedule_day: "", exhibz_schedule_pop_up: [] };
  }
}

// Decode HTML entities and clean text
function decodeText(text: string): string {
  let cleaned = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
  
  // Remove empty exhibz_speakers shortcodes (with empty or missing speaker_ids)
  // Match: [exhibz_speakers speaker_ids=""] or [exhibz_speakers speaker_ids= or [exhibz_speakers speaker_ids="]
  cleaned = cleaned
    .replace(/\[exhibz_speakers\s+speaker_ids="?"\]?/g, "") // Empty speaker_ids
    .replace(/\[exhibz_speakers\s+speaker_ids="\s*"\]/g, "") // Empty quoted speaker_ids
    .replace(/\[exhibz_speakers\s+speaker_ids=\s*\]/g, "") // speaker_ids= with nothing after
    .replace(/\[exhibz_speakers[^\]]*$/g, ""); // Incomplete shortcodes at the end
  
  // Clean up lines that only contain "Moderatör :" or similar labels followed by nothing
  cleaned = cleaned
    .replace(/Moderatör\s*:\s*$/gim, "") // "Moderatör :" at end of line
    .replace(/KONUŞMACILAR\s*:\s*$/gim, "") // "KONUŞMACILAR :" at end of line
    .replace(/^\s*:\s*$/gm, ""); // Lines with only ":"
  
  // Remove multiple consecutive newlines and clean up whitespace
  cleaned = cleaned
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // Multiple newlines to double
    .replace(/^\s+|\s+$/gm, ""); // Trim each line
  
  return cleaned.trim();
}

// Extract CDATA content
function extractCDATA(content: string): string {
  const match = content.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return match ? match[1] : content;
}

export function parseScheduleXML(xmlPath: string): ParsedSchedule {
  const fullPath = path.isAbsolute(xmlPath) ? xmlPath : path.join(process.cwd(), xmlPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`XML file not found: ${fullPath}`);
  }
  
  const xmlContent = fs.readFileSync(fullPath, "utf-8");
  
  const categories: Map<string, ScheduleCategory> = new Map();
  const days: ScheduleDay[] = [];
  
  // Detect which format we're dealing with
  const isTsSchedule = xmlContent.includes("ts-schedule");
  
  // Split by <item> tags
  const items = xmlContent.split(/<item>/).slice(1);
  
  let dayId = 1;
  
  for (const itemXml of items) {
    // Check post type
    const postTypeMatch = itemXml.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/);
    const postType = postTypeMatch ? postTypeMatch[1] : "";
    
    // Only process schedule posts
    if (postType !== "ts-schedule" && postType !== "schedule") {
      continue;
    }
    
    // Get title
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const title = titleMatch ? decodeText(titleMatch[1]) : "";
    
    // Get slug
    const slugMatch = itemXml.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/);
    const slug = slugMatch ? slugMatch[1] : "";
    
    // Get WordPress post ID
    const wpIdMatch = itemXml.match(/<wp:post_id>(\d+)<\/wp:post_id>/);
    const wpPostId = wpIdMatch ? parseInt(wpIdMatch[1]) : undefined;
    
    // Get category
    let categoryName = "Genel";
    let categorySlug = "genel";
    
    if (isTsSchedule) {
      const catMatch = itemXml.match(/<category domain="ts-schedule_cat" nicename="([^"]+)"><!\[CDATA\[(.*?)\]\]><\/category>/);
      if (catMatch) {
        categorySlug = catMatch[1];
        categoryName = catMatch[2];
      }
    } else {
      const catMatch = itemXml.match(/<category domain="date" nicename="([^"]+)"><!\[CDATA\[(.*?)\]\]><\/category>/);
      if (catMatch) {
        categorySlug = catMatch[1];
        categoryName = decodeText(catMatch[2]);
      }
    }
    
    // Add category if not exists
    if (!categories.has(categorySlug)) {
      categories.set(categorySlug, {
        id: categories.size + 1,
        name: categoryName,
        slug: categorySlug,
        order: categories.size + 1
      });
    }
    
    const category = categories.get(categorySlug)!;
    
    // Parse schedule items
    const scheduleItems: ScheduleItem[] = [];
    
    if (isTsSchedule) {
      // Parse fw_options for ts-schedule format
      const fwOptionsMatch = itemXml.match(/<wp:meta_key><!\[CDATA\[fw_options\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/);
      
      if (fwOptionsMatch) {
        const serializedData = fwOptionsMatch[1];
        const parsed = parsePhpSerialized(serializedData);
        
        const popupItems = parsed.exhibz_schedule_pop_up;
        
        if (Array.isArray(popupItems)) {
          popupItems.forEach((item, idx) => {
            if (item.schedule_time || item.schedule_title) {
              scheduleItems.push({
                id: idx + 1,
                time: item.schedule_time || "",
                title: decodeText(item.schedule_title || ""),
                note: decodeText(item.schedule_note || ""),
                isMultiSpeaker: item.isMultiSpeaker,
                wpSpeakerId: item.speakers || undefined,
                wpSpeakerIds: item.multiSpeakerIds.length > 0 ? item.multiSpeakerIds : undefined,
                order: idx + 1
              });
            }
          });
        }
      }
    } else {
      // Parse schedule format (older format)
      const timeMatch = itemXml.match(/<wp:meta_key><!\[CDATA\[tc_program_time\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(.*?)\]\]><\/wp:meta_value>/);
      const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
      
      const time = timeMatch ? timeMatch[1] : "";
      const content = contentMatch ? decodeText(contentMatch[1]) : "";
      
      if (title) {
        scheduleItems.push({
          id: 1,
          time: time,
          title: title,
          note: content,
          isMultiSpeaker: false,
          order: 1
        });
      }
    }
    
    // Create day entry
    if (title && (isTsSchedule || scheduleItems.length > 0)) {
      days.push({
        id: dayId++,
        title: title,
        slug: slug,
        categoryId: category.id,
        scheduleItems: scheduleItems,
        order: days.filter(d => d.categoryId === category.id).length + 1,
        wpPostId: wpPostId
      });
    }
  }
  
  return {
    categories: Array.from(categories.values()),
    days: days
  };
}

export async function importScheduleFromXML(xmlPath: string, clearExisting: boolean = false): Promise<{ categories: number; days: number; items: number; speakersMatched: number }> {
  const parsed = parseScheduleXML(xmlPath);
  
  // Import categories first
  let categoriesImported = 0;
  for (const cat of parsed.categories) {
    try {
      await addCategory({
        name: cat.name,
        slug: cat.slug,
      });
      categoriesImported++;
    } catch (error) {
      // Category might already exist, skip
      console.log(`Category ${cat.slug} already exists or error:`, error);
    }
  }
  
  // Build WP to local speaker ID mapping
  const wpToLocalMap = await buildWpToLocalSpeakerMap();
  
  // Convert WP speaker IDs to local IDs in parsed days
  let speakersMatched = 0;
  for (const day of parsed.days) {
      for (const item of day.scheduleItems) {
        // Single speaker
        if (item.wpSpeakerId) {
          const localId = wpToLocalMap.get(item.wpSpeakerId);
          if (localId) {
            item.speakerId = localId;
          item.speakerIds = [localId];
            speakersMatched++;
          }
        }
        
        // Multi speakers
        if (item.wpSpeakerIds && item.wpSpeakerIds.length > 0) {
          item.speakerIds = [];
          for (const wpId of item.wpSpeakerIds) {
            const localId = wpToLocalMap.get(wpId);
            if (localId) {
              item.speakerIds.push(localId);
              speakersMatched++;
            }
          }
        }
      }
  }
  
  // Import to database using importProgramData
  const daysImported = await importProgramData(parsed.days, clearExisting);
  
  // Count items
  const itemsImported = parsed.days.reduce((sum, day) => sum + day.scheduleItems.length, 0);
  
  return {
    categories: categoriesImported,
    days: daysImported,
    items: itemsImported,
    speakersMatched: speakersMatched
  };
}

