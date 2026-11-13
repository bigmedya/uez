import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const IMAGE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "images");
if (!fs.existsSync(IMAGE_UPLOAD_DIR)) {
  fs.mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true });
      cb(null, IMAGE_UPLOAD_DIR);
    } catch (e) {
      cb(e instanceof Error ? e : new Error(String(e)));
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Orijinal dosya adından kısa bir hash oluştur
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const hash = crypto.createHash("md5").update(originalName + timestamp.toString()).digest("hex").substring(0, 8);
    
    // Orijinal dosya adını maksimum 30 karaktere kısalt
    const nameWithoutExt = path.basename(originalName, ext);
    const shortName = nameWithoutExt.length > 30 
      ? nameWithoutExt.substring(0, 30) 
      : nameWithoutExt;
    
    const filename = `image-${timestamp}-${shortName}-${hash}${ext}`;
    
    // Güvenlik için dosya adı uzunluğunu kontrol et
    if (filename.length > 200) {
      const shortFilename = `image-${timestamp}-${hash}${ext}`;
      cb(null, shortFilename);
    } else {
      cb(null, filename);
    }
  },
});

// Dosya filtresi - sadece resim dosyaları
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/x-png",
    "image/gif",
    "image/webp",
    "image/avif",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
  ];
  const allowedExts = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".avif",
    ".heic",
    ".heif",
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = allowedMimes.includes(file.mimetype);
  const isValidExt = allowedExts.includes(ext);

  if (isValidMime || isValidExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Sadece JPG, JPEG, PNG, GIF ve WEBP uzantılı resim dosyaları desteklenir."
      ) as any
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// POST /api/images/upload
export const uploadImage: RequestHandler = async (req, res) => {
  try {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "Dosya boyutu 10MB'dan büyük olamaz.",
            });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Resim yüklenmedi." });
      }

      // Resim URL'sini oluştur
      const imageUrl = `/uploads/images/${req.file.filename}`;

      // Yeni yüklenen resmi dist/spa/uploads/images/ içine de kopyala
      const distPath = path.join(process.cwd(), "dist", "spa", "uploads", "images", req.file.filename);
      try {
        await fs.promises.mkdir(path.dirname(distPath), { recursive: true });
        await fs.promises.copyFile(req.file.path, distPath);
      } catch (copyError) {
        console.warn("Could not copy to dist/spa/uploads:", copyError);
      }

      res.json({
        success: true,
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      });
    });
  } catch (error) {
    console.error("[api/images/upload]", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Resim yüklenirken bir hata oluştu.",
    });
  }
};
