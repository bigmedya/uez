import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { STARS_OF_REGIONS_APPLICATION_CLOSED } from "../../shared/formFlags";

// Upload klasörünü oluştur
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "forms");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Dosya adını: formType-timestamp-hash.ext şeklinde oluştur
    // Orijinal dosya adı çok uzun olabileceği için hash kullanıyoruz
    const formType = req.body.formType || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Orijinal dosya adından kısa bir hash oluştur (ilk 8 karakter)
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const hash = crypto.createHash("md5").update(originalName + timestamp.toString()).digest("hex").substring(0, 8);
    
    // Orijinal dosya adını maksimum 30 karaktere kısalt
    const nameWithoutExt = path.basename(originalName, ext);
    const shortName = nameWithoutExt.length > 30 
      ? nameWithoutExt.substring(0, 30) 
      : nameWithoutExt;
    
    // Maksimum dosya adı uzunluğu: 255 karakter
    // formType (max 20) + timestamp (13) + shortName (30) + hash (8) + ext (5) + seperators (4) = ~80 karakter
    const filename = `${formType}-${timestamp}-${shortName}-${hash}${ext}`;
    
    // Güvenlik için dosya adı uzunluğunu kontrol et
    if (filename.length > 200) {
      // Çok uzunsa sadece hash kullan
      const shortFilename = `${formType}-${timestamp}-${hash}${ext}`;
      cb(null, shortFilename);
    } else {
      cb(null, filename);
    }
  },
});

// Dosya filtresi - sadece PDF, PPT, PPTX
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  const allowedExts = [".pdf", ".ppt", ".pptx"];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = allowedMimes.includes(file.mimetype);
  const isValidExt = allowedExts.includes(ext);

  if (isValidMime || isValidExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Sadece PDF, PPT ve PPTX uzantılı dosyalar desteklenir."
      ) as any
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
});

// POST /api/forms/upload
export const uploadFile: RequestHandler = async (req, res) => {
  try {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "Dosya boyutu 8MB'dan büyük olamaz.",
            });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Dosya yüklenmedi." });
      }

      const formType = typeof req.body?.formType === "string" ? req.body.formType : "";
      if (formType === "stars-of-regions" && STARS_OF_REGIONS_APPLICATION_CLOSED) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          /* ignore */
        }
        return res.status(403).json({ error: "Stars of Region başvuruları süresi dolmuştur." });
      }

      // Dosya URL'sini oluştur
      const fileUrl = `/uploads/forms/${req.file.filename}`;

      res.json({
        success: true,
        fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      });
    });
  } catch (error) {
    res.status(500).json({
      error: "Dosya yüklenirken bir hata oluştu.",
    });
  }
};
