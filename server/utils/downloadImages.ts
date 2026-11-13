import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { getSpeakers, updateSpeaker } from "../db";

const IMAGES_DIR = path.join(process.cwd(), "public", "speakers");

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on("error", (err) => {
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(err);
      });
    });
    
    request.on("error", reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function getExtension(url: string): string {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
  return match ? match[1].toLowerCase() : "jpg";
}

export async function downloadAllSpeakerImages(): Promise<{
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  const speakers = getSpeakers();
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  console.log(`Starting download of ${speakers.length} speaker images...`);
  
  for (const speaker of speakers) {
    // Skip if no photo or already local
    if (!speaker.photo || speaker.photo.startsWith("/speakers/")) {
      skipped++;
      continue;
    }
    
    const ext = getExtension(speaker.photo);
    const filename = `${speaker.id}-${speaker.slug}.${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    const localPath = `/speakers/${filename}`;
    
    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      updateSpeaker(speaker.id, { photo: localPath });
      skipped++;
      continue;
    }
    
    try {
      console.log(`Downloading: ${speaker.name} (${speaker.id})`);
      await downloadImage(speaker.photo, filepath);
      
      // Update database with local path
      updateSpeaker(speaker.id, { photo: localPath });
      success++;
    } catch (error) {
      const errMsg = `${speaker.id} - ${speaker.name}: ${error}`;
      errors.push(errMsg);
      console.error(`Failed: ${errMsg}`);
      failed++;
    }
    
    // Small delay to avoid overwhelming servers
    await new Promise((r) => setTimeout(r, 100));
  }
  
  console.log(`\nDownload complete: ${success} success, ${failed} failed, ${skipped} skipped`);
  
  return { success, failed, skipped, errors };
}






