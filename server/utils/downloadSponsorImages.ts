import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { getSponsorsData, updateSponsor } from "../db/sponsors";

const SPONSORS_DIR = path.join(process.cwd(), "public", "sponsors");

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getExtension(url: string, contentType?: string): string {
  // Try to get from content type first
  if (contentType) {
    if (contentType.includes("png")) return "png";
    if (contentType.includes("gif")) return "gif";
    if (contentType.includes("webp")) return "webp";
    if (contentType.includes("svg")) return "svg";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  }
  
  // Try to get from URL
  const urlPath = url.split("?")[0];
  const ext = path.extname(urlPath).toLowerCase().slice(1);
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  
  return "png"; // Default
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
        reject(new Error(`HTTP ${response.statusCode}: Failed to download ${url}`));
        return;
      }
      
      const contentType = response.headers["content-type"] || "";
      const ext = getExtension(url, contentType);
      const finalPath = filepath.replace(/\.[^.]+$/, `.${ext}`);
      
      const file = fs.createWriteStream(finalPath);
      response.pipe(file);
      
      file.on("finish", () => {
        file.close();
        resolve();
      });
      
      file.on("error", (err) => {
        fs.unlink(finalPath, () => {});
        reject(err);
      });
    });
    
    request.on("error", reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

export async function downloadAllSponsorImages(): Promise<{
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  ensureDir(SPONSORS_DIR);
  
  const data = await getSponsorsData();
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (const category of data.categories) {
    const categorySlug = slugify(category.title);
    
    for (const sponsor of category.sponsors) {
      // Skip if already has local image
      if (sponsor.localImage && fs.existsSync(path.join(process.cwd(), "public", sponsor.localImage))) {
        skipped++;
        continue;
      }
      
      // Skip if no remote image
      if (!sponsor.image) {
        skipped++;
        continue;
      }
      
      try {
        const sponsorSlug = slugify(sponsor.name);
        const ext = getExtension(sponsor.image);
        const filename = `${categorySlug}-${sponsor.id}-${sponsorSlug}.${ext}`;
        const filepath = path.join(SPONSORS_DIR, filename);
        
        await downloadImage(sponsor.image, filepath);
        
        // Update local image path in database
        const localImagePath = `/sponsors/${filename}`;
        await updateSponsor(sponsor.id, { localImage: localImagePath });
        success++;
        
        console.log(`Downloaded: ${sponsor.name}`);
      } catch (err) {
        failed++;
        errors.push(`${sponsor.name}: ${String(err)}`);
        console.error(`Failed to download ${sponsor.name}:`, err);
      }
    }
  }
  
  return { success, failed, skipped, errors };
}






