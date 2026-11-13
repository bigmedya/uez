import fs from "fs";

interface ParsedSpeaker {
  name: string;
  slug: string;
  title: string;
  photo: string;
  bio: string;
  year: string;
  order: number;
  wpPostId?: number; // WordPress post ID for linking with schedule
}

export function parseWordPressXML(xmlPath: string): ParsedSpeaker[] {
  const xmlContent = fs.readFileSync(xmlPath, "utf-8");
  const speakers: ParsedSpeaker[] = [];
  
  // First pass: Build attachment ID to URL map
  const attachmentMap = new Map<string, string>();
  const attachmentRegex = /<item>([\s\S]*?)<\/item>/g;
  let attachMatch;
  
  while ((attachMatch = attachmentRegex.exec(xmlContent)) !== null) {
    const itemContent = attachMatch[1];
    
    if (!itemContent.includes("<wp:post_type><![CDATA[attachment]]></wp:post_type>")) {
      continue;
    }
    
    const postIdMatch = itemContent.match(/<wp:post_id>(\d+)<\/wp:post_id>/);
    const urlMatch = itemContent.match(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/);
    
    if (postIdMatch && urlMatch) {
      attachmentMap.set(postIdMatch[1], urlMatch[1]);
    }
  }
  
  console.log(`Found ${attachmentMap.size} attachments`);
  
  // Second pass: Parse speakers
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;
  let order = 0;
  
  while ((itemMatch = itemRegex.exec(xmlContent)) !== null) {
    const itemContent = itemMatch[1];
    
    // Check if this is a speaker (supports both "ts-speaker" and "speaker" types)
    const isTsSpeaker = itemContent.includes("<wp:post_type><![CDATA[ts-speaker]]></wp:post_type>");
    const isSpeaker = itemContent.includes("<wp:post_type><![CDATA[speaker]]></wp:post_type>");
    
    if (!isTsSpeaker && !isSpeaker) {
      continue;
    }
    
    // Check if published
    if (!itemContent.includes("<wp:status><![CDATA[publish]]></wp:status>")) {
      continue;
    }
    
    // Extract WordPress post ID
    const wpPostIdMatch = itemContent.match(/<wp:post_id>(\d+)<\/wp:post_id>/);
    const wpPostId = wpPostIdMatch ? parseInt(wpPostIdMatch[1]) : undefined;
    
    // Extract title (name)
    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const name = titleMatch ? titleMatch[1] : "";
    
    if (!name) continue;
    
    // Extract slug
    const slugMatch = itemContent.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/);
    const slug = slugMatch ? slugMatch[1] : name.toLowerCase().replace(/\s+/g, "-");
    
    // Extract year - try multiple patterns
    let year = "2024";
    
    // Pattern 1: ts-speaker_cat category
    const yearMatch1 = itemContent.match(/<category domain="ts-speaker_cat" nicename="(\d{4})">/);
    if (yearMatch1) {
      year = yearMatch1[1];
    }
    
    // Pattern 2: post_tag category
    const yearMatch2 = itemContent.match(/<category domain="post_tag" nicename="(\d{4})">/);
    if (yearMatch2) {
      year = yearMatch2[1];
    }
    
    // Pattern 3: speaker_year category
    const yearMatch3 = itemContent.match(/<category domain="speaker_year" nicename="(\d{4})">/);
    if (yearMatch3) {
      year = yearMatch3[1];
    }
    
    let title = "";
    let photo = "";
    let bio = "";
    
    if (isTsSpeaker) {
      // Parse ts-speaker format (fw_options meta)
      const fwOptionsMatch = itemContent.match(/<wp:meta_key><!\[CDATA\[fw_options\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/);
      
      if (fwOptionsMatch) {
        const fwOptions = fwOptionsMatch[1];
        
        // Extract designation (title)
        const designationMatch = fwOptions.match(/s:18:"exhibs_designation";s:\d+:"([^"]*?)"/);
        title = designationMatch ? designationMatch[1] : "";
        
        // Extract photo URL
        const photoMatch = fwOptions.match(/s:3:"url";s:\d+:"([^"]*?)"/);
        if (photoMatch) {
          photo = photoMatch[1];
          if (photo.startsWith("//")) {
            photo = "https:" + photo;
          }
        }
        
        // Extract bio/summary
        const bioMatch = fwOptions.match(/s:14:"exhibs_summery";s:\d+:"([\s\S]*?)";s:6:"social"/);
        if (bioMatch) {
          bio = bioMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "");
        }
      }
    } else {
      // Parse speaker format (tc_speaker_company meta)
      const companyMatch = itemContent.match(/<wp:meta_key><!\[CDATA\[tc_speaker_company\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/);
      if (companyMatch) {
        title = companyMatch[1];
      }
      
      // Get photo from thumbnail_id -> attachment map
      const thumbnailMatch = itemContent.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/);
      if (thumbnailMatch) {
        const thumbnailId = thumbnailMatch[1];
        const attachmentUrl = attachmentMap.get(thumbnailId);
        if (attachmentUrl) {
          photo = attachmentUrl;
        }
      }
      
      // Extract bio from content if available
      const contentMatch = itemContent.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
      if (contentMatch && contentMatch[1].trim()) {
        bio = contentMatch[1];
      }
    }
    
    speakers.push({
      name,
      slug,
      title,
      photo,
      bio,
      year,
      order: order++,
      wpPostId,
    });
  }
  
  return speakers;
}
