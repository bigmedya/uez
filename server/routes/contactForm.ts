import { RequestHandler } from "express";
import { sendEmail, EmailData } from "../utils/email";
import { addFormResponse, getFormResponses } from "../db/forms";
import { z } from "zod";

// Validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, "Ad Soyad gereklidir").max(200, "Ad Soyad çok uzun"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").max(200, "E-posta çok uzun"),
  phone: z.string().max(50, "Telefon çok uzun").optional(),
  subject: z.string().min(1, "Konu gereklidir").max(200, "Konu çok uzun"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır").max(5000, "Mesaj çok uzun"),
  // Honeypot field - should be empty
  website: z.string().max(0, "Spam tespit edildi").optional(),
  formStartTime: z.string().optional(),
});

export const sendContactEmailHandler: RequestHandler = async (req, res) => {
  try {
    // SPAM KORUMASI 1: Honeypot kontrolü
    if (req.body.website && req.body.website.trim() !== "") {
      res.status(400).json({
        error: "Spam tespit edildi. Lütfen tekrar deneyin.",
      });
      return;
    }

    // SPAM KORUMASI 2: Time-based validation (form çok hızlı gönderilirse spam)
    if (req.body.formStartTime) {
      const formStartTime = parseInt(req.body.formStartTime, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - formStartTime;
      
      // Form 3 saniyeden az sürede gönderilirse spam olabilir
      if (timeDiff < 3000) {
        res.status(400).json({
          error: "Form çok hızlı gönderildi. Lütfen tekrar deneyin.",
        });
        return;
      }
      
      // Form 1 saatten fazla sürede gönderilirse de şüpheli
      if (timeDiff > 3600000) {
        res.status(400).json({
          error: "Form süresi dolmuş. Lütfen sayfayı yenileyip tekrar deneyin.",
        });
        return;
      }
    }

    // SPAM KORUMASI 3: Rate limiting (IP bazlı)
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    if (ipAddress !== "unknown") {
      try {
        const recentResponses = await getFormResponses("iletisim");
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000); // 2 dakika
        
        const recentFromSameIP = recentResponses.filter((response) => {
          return (
            response.ipAddress === ipAddress &&
            new Date(response.submittedAt) > twoMinutesAgo
          );
        });

        // Son 2 dakikada 3'ten fazla gönderim varsa engelle
        if (recentFromSameIP.length >= 3) {
          res.status(429).json({
            error: "Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.",
          });
          return;
        }
      } catch (rateLimitError) {
        // Rate limiting hatası olsa bile form gönderimine devam et
      }
    }

    // Validate request body
    const validationResult = contactFormSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: "Geçersiz form verisi",
        details: validationResult.error.errors,
      });
      return;
    }

    const formData: EmailData = {
      name: validationResult.data.name,
      email: validationResult.data.email,
      phone: validationResult.data.phone || undefined,
      subject: validationResult.data.subject,
      message: validationResult.data.message,
    };

    const submittedAt = new Date().toISOString();

    // Veritabanına kaydet
    try {
      await addFormResponse({
        formType: "iletisim",
        formName: "İletişim Formu",
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "",
          subject: formData.subject,
          message: formData.message,
        },
        ipAddress,
        submittedAt,
      });
    } catch (dbError) {
      // Veritabanı hatası olsa bile email göndermeyi deneyebiliriz
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      res.status(500).json({
        error: "SMTP yapılandırması eksik. Lütfen .env dosyasını kontrol edin.",
      });
      return;
    }

    // Send email
    await sendEmail(formData);

    res.json({
      success: true,
      message: "Mesajınız başarıyla gönderildi!",
    });
  } catch (error) {
    res.status(500).json({
      error: "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
    });
  }
};
