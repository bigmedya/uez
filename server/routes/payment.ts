import "dotenv/config";
import { RequestHandler } from "express";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { addFormResponse, getFormResponseById, updateFormResponseData, markUTMRegistrationAsPaid } from "../db/forms";
import { sendRegistrationEmail, RegistrationEmailData } from "../utils/email";

const requireModule = createRequire(import.meta.url);
const Iyzipay = requireModule("iyzipay");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 3DS callback için: conversationId (form response id) -> paymentId (iyzico init yanıtından) */
const pending3DS: Record<string, string> = {};

/** "52.000 TL" veya "1.500,50 TL" gibi metni sayıya çevirir (TRY) */
function parsePriceToNumber(priceStr: string): number {
  if (typeof priceStr !== "string") return 0;
  const cleaned = priceStr.replace(/\s*TL\s*/gi, "").trim().replace(/\s/g, "");
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return parseFloat(cleaned.replace(/\./g, "")) || 0;
}

function getIyzipayClient() {
  let apiKey = process.env.IYZICO_API_KEY;
  let secretKey = process.env.IYZICO_SECRET_KEY;

  if (!apiKey || !secretKey) {
    // Sunucu farklı cwd ile çalışıyorsa .env proje kökünden yükle
    const dotenv = requireModule("dotenv");
    const projectRoot = path.resolve(__dirname, "../..");
    dotenv.config({ path: path.join(projectRoot, ".env") });
    apiKey = process.env.IYZICO_API_KEY;
    secretKey = process.env.IYZICO_SECRET_KEY;
  }

  const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
  if (!apiKey || !secretKey) {
    throw new Error("IYZICO_API_KEY ve IYZICO_SECRET_KEY .env içinde tanımlanmalıdır.");
  }
  return new Iyzipay({
    apiKey,
    secretKey,
    uri: baseUrl,
  });
}

/** "MM/YY" formatını iyzico için expireMonth, expireYear'a çevirir */
function parseExpiry(sonKullanma: string): { month: string; year: string } {
  const cleaned = String(sonKullanma).replace(/\D/g, "");
  const month = cleaned.slice(0, 2) || "01";
  let year = cleaned.slice(2, 4) || "30";
  if (year.length === 2) year = "20" + year;
  return { month, year };
}

const isIyzicoActive = () => process.env.IS_IYZICO_ACTIVE?.toLowerCase() === "true";

/** POST /api/payment/process - 3D Secure ile ödeme: threedsInitialize döner, banka ekranına yönlendirilir */
export const processPayment: RequestHandler = async (req, res) => {
  try {
    const { data } = req.body as { data: Record<string, unknown> };
    if (!data || !data.packageId || !data.packagePrice) {
      res.status(400).json({ error: "Paket bilgisi ve form verisi gerekli." });
      return;
    }

    const kartNumarasi = String(data.kartNumarasi || "").replace(/\s/g, "");
    const cvc = String(data.cvc || "").trim();
    const sonKullanma = String(data.sonKullanma || "").trim();
    if (kartNumarasi.length < 15 || cvc.length < 3 || sonKullanma.length < 4) {
      res.status(400).json({ error: "Kart bilgileri eksik veya geçersiz." });
      return;
    }

    const paidPrice = parsePriceToNumber(String(data.packagePrice));
    if (paidPrice <= 0) {
      res.status(400).json({ error: "Geçerli bir tutar girin." });
      return;
    }

    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const submittedAt = new Date().toISOString();

    // iyzico kapalıyken: aynı process datasını DB'ye kaydet (kart bilgileri dahil), ödemeyi atla, durum pending
    if (!isIyzicoActive()) {
      const formDataForDbBypass = { ...data };
      (formDataForDbBypass as Record<string, unknown>).paymentMethod = "kredi";
      (formDataForDbBypass as Record<string, unknown>).paymentStatus = "pending";

      const response = await addFormResponse({
        formType: "kayit",
        formName: "UEZ 2026 Kayıt Formu",
        data: formDataForDbBypass,
        ipAddress,
        submittedAt,
      });

      if (data.eposta && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        try {
          const emailData: RegistrationEmailData = {
            packageTitle: (data.packageTitle as string) || "",
            packageSubtitle: (data.packageSubtitle as string) || "",
            packagePrice: (data.packagePrice as string) || "",
            paymentMethod: "kredi",
            invoiceType: (data.invoiceType as string) || "",
            isEFatura: !!data.isEFatura,
            adSoyad: (data.adSoyad as string) || "",
            kurumAdi: (data.kurumAdi as string) || "",
            unvan: (data.unvan as string) || "",
            kurumAdresi: (data.kurumAdresi as string) || "",
            telefon: (data.telefon as string) || "",
            eposta: (data.eposta as string) || "",
            ceptel: (data.ceptel as string) || "",
            asistanAdSoyad: (data.asistanAdSoyad as string) || "",
            asistanEposta: (data.asistanEposta as string) || "",
            asistanTelefon: (data.asistanTelefon as string) || "",
            adSoyad2: (data.adSoyad2 as string) || "",
            kurumAdi2: (data.kurumAdi2 as string) || "",
            unvan2: (data.unvan2 as string) || "",
            kurumAdresi2: (data.kurumAdresi2 as string) || "",
            telefon2: (data.telefon2 as string) || "",
            eposta2: (data.eposta2 as string) || "",
            ceptel2: (data.ceptel2 as string) || "",
            firmaUnvani: (data.firmaUnvani as string) || "",
            faturaSehir: (data.faturaSehir as string) || "",
            faturaIlce: (data.faturaIlce as string) || "",
            faturaAdres: (data.faturaAdres as string) || "",
            faturaPostaKodu: (data.faturaPostaKodu as string) || "",
            vergiDairesi: (data.vergiDairesi as string) || "",
            vergiNo: (data.vergiNo as string) || "",
            eArsivEmail: (data.eArsivEmail as string) || "",
            tcKimlik: (data.tcKimlik as string) || "",
            ilgiliKisi: (data.ilgiliKisi as string) || "",
            sahisFaturaSehir: (data.sahisFaturaSehir as string) || "",
            sahisFaturaIlce: (data.sahisFaturaIlce as string) || "",
            sahisFaturaAdres: (data.sahisFaturaAdres as string) || "",
            sahisFaturaPostaKodu: (data.sahisFaturaPostaKodu as string) || "",
            sahisEposta: (data.sahisEposta as string) || "",
          };
          await sendRegistrationEmail(emailData);
        } catch (emailError) {
          console.error("Registration email (iyzico bypass):", emailError);
        }
      }

      res.status(200).json({ success: true, formResponseId: response.id });
      return;
    }

    const { month: expireMonth, year: expireYear } = parseExpiry(sonKullanma);

    const formDataForDb = { ...data };
    delete formDataForDb.kartNumarasi;
    delete formDataForDb.cvc;
    delete formDataForDb.sonKullanma;
    (formDataForDb as Record<string, unknown>).paymentMethod = "kredi";
    (formDataForDb as Record<string, unknown>).paymentStatus = "pending";

    const response = await addFormResponse({
      formType: "kayit",
      formName: "UEZ 2026 Kayıt Formu",
      data: formDataForDb,
      ipAddress,
      submittedAt,
    });

    const buyerName = String(data.adSoyad || "").trim();
    const nameParts = buyerName.split(/\s+/);
    const firstName = nameParts[0] || "Katilimci";
    const lastName = nameParts.slice(1).join(" ") || "";

    const invoiceType = data.invoiceType === "sahis" ? "sahis" : "firma";
    const city = invoiceType === "firma"
      ? String(data.faturaSehir || "Istanbul")
      : String(data.sahisFaturaSehir || "Istanbul");
    const address = invoiceType === "firma"
      ? String(data.faturaAdres || data.kurumAdresi || "-")
      : String(data.sahisFaturaAdres || "-");
    const zipCode = invoiceType === "firma"
      ? String(data.faturaPostaKodu || "34000")
      : String(data.sahisFaturaPostaKodu || "34000");

    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get("host") || ""}`;
    const callbackUrl = `${baseUrl.replace(/\/$/, "")}/api/payment/3ds-callback`;

    const iyzipay = getIyzipayClient();
    const basketId = `UEZ-${response.id}-${Date.now()}`;
    const paymentRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: String(response.id),
      price: String(paidPrice.toFixed(2)),
      paidPrice: String(paidPrice.toFixed(2)),
      currency: Iyzipay.CURRENCY.TRY,
      installment: "1",
      basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      paymentCard: {
        cardHolderName: buyerName || "Katilimci",
        cardNumber: kartNumarasi,
        expireMonth,
        expireYear,
        cvc,
        registerCard: "0",
      },
      buyer: {
        id: `BY${response.id}`,
        name: firstName,
        surname: lastName || firstName,
        gsmNumber: `+90${String(data.telefon || data.ceptel || "").replace(/\D/g, "").slice(-10)}`,
        email: String(data.eposta || ""),
        identityNumber: String(data.tcKimlik || "11111111110"),
        lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        registrationDate: new Date().toISOString().slice(0, 19).replace("T", " "),
        registrationAddress: address,
        ip: ipAddress,
        city,
        country: "Turkey",
        zipCode: zipCode || "34000",
      },
      shippingAddress: {
        contactName: buyerName || "Katilimci",
        city,
        country: "Turkey",
        address,
        zipCode: zipCode || "34000",
      },
      billingAddress: {
        contactName: buyerName || "Katilimci",
        city,
        country: "Turkey",
        address,
        zipCode: zipCode || "34000",
      },
      basketItems: [
        {
          id: `BI-${response.id}`,
          name: String(data.packageTitle || "UEZ 2026 Katılım"),
          category1: "Etkinlik",
          category2: "Zirve",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: String(paidPrice.toFixed(2)),
        },
      ],
    };

    iyzipay.threedsInitialize.create(paymentRequest, (err: Error | null, result: Record<string, unknown>) => {
      if (err) {
        console.error("iyzico threedsInitialize error:", err);
        updateFormResponseData(response.id, { paymentStatus: "failed" }).catch(() => {});
        res.status(500).json({ success: false, error: "3D Secure oturumu oluşturulamadı. Lütfen tekrar deneyin." });
        return;
      }
      if (result.status !== "success") {
        const errMsg = (result.errorMessage as string) || (result.errorCode as string) || "Ödeme başlatılamadı.";
        updateFormResponseData(response.id, { paymentStatus: "failed", iyzicoError: errMsg }).catch(() => {});
        res.status(200).json({ success: false, error: errMsg });
        return;
      }

      const paymentId = result.paymentId as string;
      if (paymentId) pending3DS[String(response.id)] = paymentId;

      const threeDSHtmlContent = result.threeDSHtmlContent as string;
      if (!threeDSHtmlContent) {
        updateFormResponseData(response.id, { paymentStatus: "failed", iyzicoError: "3DS HTML alınamadı" }).catch(() => {});
        res.status(200).json({ success: false, error: "Banka doğrulama sayfası alınamadı. Lütfen tekrar deneyin." });
        return;
      }

      res.status(200).json({
        success: true,
        threeDSHtmlContent,
        formResponseId: response.id,
      });
    });
  } catch (error) {
    console.error("processPayment error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Ödeme işlenemedi.",
    });
  }
};

/** GET/POST /api/payment/3ds-callback - Banka 3D Secure doğrulaması sonrası yönlendirir; ödemeyi tamamlar */
export const payment3dsCallback: RequestHandler = async (req, res) => {
  const paymentId = (req.body?.paymentId ?? req.query?.paymentId) as string | undefined;
  const conversationId = (req.body?.conversationId ?? req.query?.conversationId) as string | undefined;
  const conversationData = (req.body?.conversationData ?? req.query?.conversationData) as string | undefined;

  if (!paymentId || !conversationId) {
    res.redirect("/?payment=error&message=missing_params");
    return;
  }

  try {
    const iyzipay = getIyzipayClient();
    iyzipay.threedsPayment.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        paymentId,
        conversationData: conversationData ?? "",
      },
      async (err: Error | null, result: Record<string, unknown>) => {
        const formResponseId = conversationId ? parseInt(conversationId, 10) : 0;
        if (err) {
          console.error("iyzico threedsPayment error:", err);
          if (formResponseId) await updateFormResponseData(formResponseId, { paymentStatus: "failed", iyzicoError: String(err.message) }).catch(() => {});
          res.redirect("/?payment=error&message=auth_failed");
          return;
        }

        const isSuccess = result.status === "success";

        await updateFormResponseData(formResponseId, {
          paymentStatus: isSuccess ? "success" : "failed",
          iyzicoPaymentId: result.paymentId ?? undefined,
          iyzicoPaidPrice: result.paidPrice ?? undefined,
          iyzicoResult: result,
        }).catch(() => {});

        if (isSuccess) {
          // UTM tracking'i paid olarak işaretle
          await markUTMRegistrationAsPaid(formResponseId);
          
          const formResponse = await getFormResponseById(formResponseId);
          const data = formResponse?.data;
          if (data?.eposta && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            try {
              const emailData: RegistrationEmailData = {
                packageTitle: (data.packageTitle as string) || "",
                packageSubtitle: (data.packageSubtitle as string) || "",
                packagePrice: (data.packagePrice as string) || "",
                paymentMethod: "kredi",
                invoiceType: (data.invoiceType as string) || "",
                isEFatura: !!data.isEFatura,
                adSoyad: (data.adSoyad as string) || "",
                kurumAdi: (data.kurumAdi as string) || "",
                unvan: (data.unvan as string) || "",
                kurumAdresi: (data.kurumAdresi as string) || "",
                telefon: (data.telefon as string) || "",
                eposta: (data.eposta as string) || "",
                ceptel: (data.ceptel as string) || "",
                asistanAdSoyad: (data.asistanAdSoyad as string) || "",
                asistanEposta: (data.asistanEposta as string) || "",
                asistanTelefon: (data.asistanTelefon as string) || "",
                adSoyad2: (data.adSoyad2 as string) || "",
                kurumAdi2: (data.kurumAdi2 as string) || "",
                unvan2: (data.unvan2 as string) || "",
                kurumAdresi2: (data.kurumAdresi2 as string) || "",
                telefon2: (data.telefon2 as string) || "",
                eposta2: (data.eposta2 as string) || "",
                ceptel2: (data.ceptel2 as string) || "",
                firmaUnvani: (data.firmaUnvani as string) || "",
                faturaSehir: (data.faturaSehir as string) || "",
                faturaIlce: (data.faturaIlce as string) || "",
                faturaAdres: (data.faturaAdres as string) || "",
                faturaPostaKodu: (data.faturaPostaKodu as string) || "",
                vergiDairesi: (data.vergiDairesi as string) || "",
                vergiNo: (data.vergiNo as string) || "",
                eArsivEmail: (data.eArsivEmail as string) || "",
                tcKimlik: (data.tcKimlik as string) || "",
                ilgiliKisi: (data.ilgiliKisi as string) || "",
                sahisFaturaSehir: (data.sahisFaturaSehir as string) || "",
                sahisFaturaIlce: (data.sahisFaturaIlce as string) || "",
                sahisFaturaAdres: (data.sahisFaturaAdres as string) || "",
                sahisFaturaPostaKodu: (data.sahisFaturaPostaKodu as string) || "",
                sahisEposta: (data.sahisEposta as string) || "",
              };
              await sendRegistrationEmail(emailData);
            } catch (emailError) {
              console.error("Registration email after 3DS:", emailError);
            }
          }
          res.redirect("/?payment=success");
        } else {
          const errMsg = (result.errorMessage as string) || (result.errorCode as string) || "Ödeme tamamlanamadı.";
          res.redirect(`/?payment=failed&message=${encodeURIComponent(errMsg)}`);
        }
      }
    );
  } catch (error) {
    console.error("payment3dsCallback error:", error);
    res.redirect("/?payment=error");
  }
};

/** POST /api/payment/checkout-initialize - Kredi kartı için iyzico Checkout Form başlatır (yönlendirme akışı) */
export const checkoutInitialize: RequestHandler = async (req, res) => {
  try {
    const { data } = req.body as { data: Record<string, unknown> };
    if (!data || !data.packageId || !data.packagePrice) {
      res.status(400).json({ error: "Paket bilgisi ve form verisi gerekli." });
      return;
    }

    const paidPrice = parsePriceToNumber(String(data.packagePrice));
    if (paidPrice <= 0) {
      res.status(400).json({ error: "Geçerli bir tutar girin." });
      return;
    }

    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const submittedAt = new Date().toISOString();

    const formDataForDb = {
      ...data,
      paymentMethod: "kredi",
      paymentStatus: "pending",
      kartNumarasi: undefined,
      cvc: undefined,
      sonKullanma: undefined,
    };

    const response = await addFormResponse({
      formType: "kayit",
      formName: "UEZ 2026 Kayıt Formu",
      data: formDataForDb,
      ipAddress,
      submittedAt,
    });

    const conversationId = String(response.id);
    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get("host") || ""}`;
    const callbackUrl = `${baseUrl}/api/payment/callback`;

    const buyerName = String(data.adSoyad || "").trim();
    const nameParts = buyerName.split(/\s+/);
    const firstName = nameParts[0] || "Katilimci";
    const lastName = nameParts.slice(1).join(" ") || "";

    const invoiceType = data.invoiceType === "sahis" ? "sahis" : "firma";
    const city = invoiceType === "firma"
      ? String(data.faturaSehir || "Istanbul")
      : String(data.sahisFaturaSehir || "Istanbul");
    const address = invoiceType === "firma"
      ? String(data.faturaAdres || data.kurumAdresi || "-")
      : String(data.sahisFaturaAdres || "-");
    const zipCode = invoiceType === "firma"
      ? String(data.faturaPostaKodu || "34000")
      : String(data.sahisFaturaPostaKodu || "34000");
    const contactName = buyerName || "Katilimci";

    const iyzipay = getIyzipayClient();
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: String(paidPrice.toFixed(2)),
      paidPrice: String(paidPrice.toFixed(2)),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: `UEZ-${response.id}-${Date.now()}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      enabledInstallments: [1, 2, 3, 4, 6, 9, 12],
      buyer: {
        id: `BY${response.id}`,
        name: firstName,
        surname: lastName || firstName,
        gsmNumber: `+90${String(data.telefon || data.ceptel || "").replace(/\D/g, "").slice(-10)}`,
        email: String(data.eposta || ""),
        identityNumber: String(data.tcKimlik || "11111111110"),
        registrationAddress: address,
        ip: ipAddress,
        city,
        country: "Turkey",
        zipCode: zipCode || "34000",
      },
      shippingAddress: {
        contactName,
        city,
        country: "Turkey",
        address,
        zipCode: zipCode || "34000",
      },
      billingAddress: {
        contactName,
        city,
        country: "Turkey",
        address,
        zipCode: zipCode || "34000",
      },
      basketItems: [
        {
          id: `BI-${response.id}`,
          name: String(data.packageTitle || "UEZ 2026 Katılım"),
          category1: "Etkinlik",
          category2: "Zirve",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: String(paidPrice.toFixed(2)),
        },
      ],
    };

    iyzipay.checkoutFormInitialize.create(request, (err: Error | null, result: Record<string, unknown>) => {
      if (err) {
        console.error("iyzico checkout initialize error:", err);
        res.status(500).json({ error: "Ödeme oturumu oluşturulamadı. Lütfen tekrar deneyin." });
        return;
      }
      if (result.status !== "success") {
        console.error("iyzico result:", result);
        res.status(400).json({
          error: (result.errorMessage as string) || "Ödeme oturumu başlatılamadı.",
        });
        return;
      }
      res.json({
        success: true,
        formResponseId: response.id,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
      });
    });
  } catch (error) {
    console.error("checkout-initialize error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Ödeme başlatılamadı.",
    });
  }
};

/** GET /api/payment/callback - iyzico ödeme sonrası yönlendirme */
export const paymentCallback: RequestHandler = async (req, res) => {
  const token = (req.query.token as string) || (req.body?.token as string);
  if (!token) {
    res.redirect("/?payment=error&message=token_missing");
    return;
  }

  try {
    const iyzipay = getIyzipayClient();
    iyzipay.checkoutForm.retrieve(
      {
        locale: "tr",
        conversationId: "",
        token,
      },
      async (err: Error | null, result: Record<string, unknown>) => {
        if (err) {
          console.error("iyzico retrieve error:", err);
          res.redirect("/?payment=error&message=retrieve_failed");
          return;
        }

        const conversationId = result.conversationId as string;
        const paymentStatus = result.paymentStatus as string;
        const formResponseId = conversationId ? parseInt(conversationId, 10) : 0;

        if (!formResponseId || isNaN(formResponseId)) {
          res.redirect("/?payment=error&message=invalid_response");
          return;
        }

        const isSuccess = paymentStatus === "SUCCESS";

        await updateFormResponseData(formResponseId, {
          paymentStatus: isSuccess ? "success" : "failed",
          iyzicoPaymentId: result.paymentId ?? undefined,
          iyzicoPaidPrice: result.paidPrice ?? undefined,
          iyzicoResult: result,
        });

        if (isSuccess) {
          await markUTMRegistrationAsPaid(formResponseId);
          
          const formResponse = await getFormResponseById(formResponseId);
          const data = formResponse?.data;
          if (data?.eposta && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            try {
              const emailData: RegistrationEmailData = {
                packageTitle: (data.packageTitle as string) || "",
                packageSubtitle: (data.packageSubtitle as string) || "",
                packagePrice: (data.packagePrice as string) || "",
                paymentMethod: "kredi",
                invoiceType: (data.invoiceType as string) || "",
                isEFatura: !!data.isEFatura,
                adSoyad: (data.adSoyad as string) || "",
                kurumAdi: (data.kurumAdi as string) || "",
                unvan: (data.unvan as string) || "",
                kurumAdresi: (data.kurumAdresi as string) || "",
                telefon: (data.telefon as string) || "",
                eposta: (data.eposta as string) || "",
                ceptel: (data.ceptel as string) || "",
                asistanAdSoyad: (data.asistanAdSoyad as string) || "",
                asistanEposta: (data.asistanEposta as string) || "",
                asistanTelefon: (data.asistanTelefon as string) || "",
                adSoyad2: (data.adSoyad2 as string) || "",
                kurumAdi2: (data.kurumAdi2 as string) || "",
                unvan2: (data.unvan2 as string) || "",
                kurumAdresi2: (data.kurumAdresi2 as string) || "",
                telefon2: (data.telefon2 as string) || "",
                eposta2: (data.eposta2 as string) || "",
                ceptel2: (data.ceptel2 as string) || "",
                firmaUnvani: (data.firmaUnvani as string) || "",
                faturaSehir: (data.faturaSehir as string) || "",
                faturaIlce: (data.faturaIlce as string) || "",
                faturaAdres: (data.faturaAdres as string) || "",
                faturaPostaKodu: (data.faturaPostaKodu as string) || "",
                vergiDairesi: (data.vergiDairesi as string) || "",
                vergiNo: (data.vergiNo as string) || "",
                eArsivEmail: (data.eArsivEmail as string) || "",
                tcKimlik: (data.tcKimlik as string) || "",
                ilgiliKisi: (data.ilgiliKisi as string) || "",
                sahisFaturaSehir: (data.sahisFaturaSehir as string) || "",
                sahisFaturaIlce: (data.sahisFaturaIlce as string) || "",
                sahisFaturaAdres: (data.sahisFaturaAdres as string) || "",
                sahisFaturaPostaKodu: (data.sahisFaturaPostaKodu as string) || "",
                sahisEposta: (data.sahisEposta as string) || "",
              };
              await sendRegistrationEmail(emailData);
            } catch (emailError) {
              console.error("Registration email after payment:", emailError);
            }
          }
          res.redirect("/?payment=success");
        } else {
          res.redirect("/?payment=failed");
        }
      }
    );
  } catch (error) {
    console.error("payment callback error:", error);
    res.redirect("/?payment=error");
  }
};
