import nodemailer from "nodemailer";

export interface EmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// XSS koruması için HTML escape fonksiyonu
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function sendEmail(data: EmailData): Promise<void> {
  // Check if msmtp should be used
  let transporter;

  if (process.env.USE_MSMTP === "true") {
    // Use msmtp via sendmail
    transporter = nodemailer.createTransport({
      sendmail: true,
      newline: "unix",
      path: "/usr/bin/msmtp",
    });
  } else {
    // SMTP configuration from environment variables
    const port = parseInt(process.env.SMTP_PORT || "587");
    // Port 587 için secure false olmalı (STARTTLS kullanılır)
    // Port 465 için secure true olmalı (SSL kullanılır)
    const isSecure = port === 465 || process.env.SMTP_SECURE === "true";

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure, // true for 465, false for other ports
      requireTLS: !isSecure && port === 587, // STARTTLS for port 587
      tls: {
        rejectUnauthorized: false, // Bazı sunucular için gerekli
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // XSS koruması için tüm kullanıcı girdilerini escape et
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = data.phone ? escapeHtml(data.phone) : "";
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br>");

  // İletişim formu: gönderen sabit uez@bigmedia.com.tr
  // Kullanıcı sadece kendisini alıcı görsün; diğer adresler BCC ile gizli kopyalanır
  const mailOptions = {
    from: "uez@bigmedia.com.tr",
    to: data.email,
    bcc: "uez@bigmedia.com.tr",
    subject: `İletişim Formu: ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1F0034; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #1F0034; }
          .value { margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Yeni İletişim Formu Mesajı</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Ad Soyad:</div>
              <div class="value">${safeName}</div>
            </div>
            <div class="field">
              <div class="label">E-posta:</div>
              <div class="value">${safeEmail}</div>
            </div>
            ${safePhone ? `
            <div class="field">
              <div class="label">Telefon:</div>
              <div class="value">${safePhone}</div>
            </div>
            ` : ""}
            <div class="field">
              <div class="label">Konu:</div>
              <div class="value">${safeSubject}</div>
            </div>
            <div class="field">
              <div class="label">Mesaj:</div>
              <div class="value">${safeMessage}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Yeni İletişim Formu Mesajı

Ad Soyad: ${data.name}
E-posta: ${data.email}
${data.phone ? `Telefon: ${data.phone}` : ""}
Konu: ${data.subject}

Mesaj:
${data.message}
    `,
  };

  await transporter.sendMail(mailOptions);
}

export interface RegistrationEmailData {
  packageTitle: string;
  packageSubtitle?: string;
  packagePrice: string;
  paymentMethod: string;
  invoiceType: string;
  isEFatura?: boolean;
  // Katılımcı bilgileri
  adSoyad: string;
  kurumAdi?: string;
  unvan?: string;
  kurumAdresi?: string;
  telefon?: string;
  eposta: string;
  ceptel?: string;
  asistanAdSoyad?: string;
  asistanEposta?: string;
  asistanTelefon?: string;
  // İkinci katılımcı (çift kişi için)
  adSoyad2?: string;
  kurumAdi2?: string;
  unvan2?: string;
  kurumAdresi2?: string;
  telefon2?: string;
  eposta2?: string;
  ceptel2?: string;
  // Fatura bilgileri
  firmaUnvani?: string;
  faturaSehir?: string;
  faturaIlce?: string;
  faturaAdres?: string;
  faturaPostaKodu?: string;
  vergiDairesi?: string;
  vergiNo?: string;
  eArsivEmail?: string;
  tcKimlik?: string;
  ilgiliKisi?: string;
  sahisFaturaSehir?: string;
  sahisFaturaIlce?: string;
  sahisFaturaAdres?: string;
  sahisFaturaPostaKodu?: string;
  sahisEposta?: string;
}

export async function sendRegistrationEmail(data: RegistrationEmailData): Promise<void> {
  // Check if msmtp should be used
  let transporter;

  if (process.env.USE_MSMTP === "true") {
    // Use msmtp via sendmail
    transporter = nodemailer.createTransport({
      sendmail: true,
      newline: "unix",
      path: "/usr/bin/msmtp",
    });
  } else {
    // SMTP configuration from environment variables
    const port = parseInt(process.env.SMTP_PORT || "587");
    // Port 587 için secure false olmalı (STARTTLS kullanılır)
    // Port 465 için secure true olmalı (SSL kullanılır)
    const isSecure = port === 465 || process.env.SMTP_SECURE === "true";

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure, // true for 465, false for other ports
      requireTLS: !isSecure && port === 587, // STARTTLS for port 587
      tls: {
        rejectUnauthorized: false, // Bazı sunucular için gerekli
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // XSS koruması için escape
  const escape = (text: string | undefined) => text ? escapeHtml(text) : "";

  // Email içeriği oluştur
  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>UEZ 2026 - Kayıt</title>
  <style>
    body { margin:0; padding:0; background:#f6f7fb; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; display:block; }
    a { color:inherit; text-decoration:none; }

    .wrap { width:100%; background:#f6f7fb; padding:24px 12px; }
    .card { max-width:720px; margin:0 auto; background:#ffffff; border:1px solid #eceef3; border-radius:14px; overflow:hidden; }
    .topbar { background:#0f172a; color:#ffffff; }
    .top-inner { padding:18px 22px; }
    .logo { width:140px; height:auto; }
    .h-title { font-size:18px; font-weight:700; margin:0; line-height:1.25; }
    .h-sub { font-size:13px; margin:6px 0 0 0; opacity:.85; line-height:1.4; }
    .meta { margin-top:10px; font-size:12px; opacity:.9; }
    .badge { display:inline-block; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18); margin-right:8px; }

    .content { padding:18px 22px 6px 22px; }
    .success { margin:12px 0 14px 0; padding:10px 12px; border-radius:10px; background:#ecfdf5; border:1px solid #a7f3d0; color:#047857; font-weight:600; font-size:13px; }
    .divider { height:1px; background:#eceef3; margin:14px 0; }

    .section-title { font-size:13px; font-weight:800; color:#0f172a; margin:0 0 8px 0; letter-spacing:.02em; }
    .hint { font-size:12px; color:#64748b; margin:0 0 10px 0; line-height:1.5; }
    .contact-block { font-size:12px; color:#334155; margin:4px 0; line-height:1.5; }

    .kv { width:100%; border:1px solid #eef0f6; border-radius:12px; overflow:hidden; }
    .kv tr { border-bottom:1px solid #eef0f6; }
    .kv tr:last-child { border-bottom:none; }
    .k { width:34%; padding:9px 12px; background:#fafbff; color:#334155; font-weight:700; font-size:12.5px; vertical-align:top; }
    .v { padding:9px 12px; color:#0f172a; font-size:12.5px; line-height:1.45; }

    .footer { padding:14px 22px 18px 22px; color:#64748b; font-size:12px; line-height:1.6; background:#fbfcff; border-top:1px solid #eef0f6; }
    .muted { color:#94a3b8; }

    /* Mobile */
    @media (max-width:560px){
      .top-inner, .content, .footer { padding-left:14px !important; padding-right:14px !important; }
      .logo { width:120px !important; }
      .k { width:42% !important; }
    }
  </style>
</head>

<body>
  <div class="wrap">
    <div class="card">

      <!-- Header (Logo left, text right) -->
      <div class="topbar">
        <div class="top-inner">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="160" valign="middle" style="padding-right:14px;">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=295"
                  alt="UEZ Logo"
                  class="logo"
                />
              </td>
              <td valign="middle">
                <p class="h-title">Kayıt Onayı</p>
                <p class="h-sub">Başvurunuz başarıyla alındı. Aşağıda kayıt detaylarınızı bulabilirsiniz.</p>

                <div class="meta">
                  <span class="badge">${escape(data.packageTitle)}${data.packageSubtitle ? " • " + escape(data.packageSubtitle) : ""}</span>
                  <span class="badge">${escape(data.packagePrice)} TL</span>
                  <span class="badge">${data.paymentMethod === "kredi" ? "Kredi Kartı" : "Banka Havalesi"}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="content">
        <!-- Paket -->
        <div class="section-title">Paket Bilgileri</div>
        <table class="kv" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td class="k">Paket</td>
            <td class="v">${escape(data.packageTitle)} ${escape(data.packageSubtitle || "")}</td>
          </tr>
          <tr>
            <td class="k">Fiyat</td>
            <td class="v">${escape(data.packagePrice)} TL</td>
          </tr>
          <tr>
            <td class="k">Ödeme</td>
            <td class="v">${data.paymentMethod === "kredi" ? "Kredi Kartı" : "Banka Havalesi"}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <!-- Katılımcı -->
        <div class="section-title">Katılımcı Bilgileri</div>
        <table class="kv" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td class="k">Ad Soyad</td>
            <td class="v">${escape(data.adSoyad)}</td>
          </tr>
          <tr>
            <td class="k">E-posta</td>
            <td class="v">${escape(data.eposta)}</td>
          </tr>
          ${data.kurumAdi ? `<tr><td class="k">Kurum</td><td class="v">${escape(data.kurumAdi)}</td></tr>` : ""}
          ${data.unvan ? `<tr><td class="k">Ünvan</td><td class="v">${escape(data.unvan)}</td></tr>` : ""}
          ${data.kurumAdresi ? `<tr><td class="k">Kurum Adresi</td><td class="v">${escape(data.kurumAdresi)}</td></tr>` : ""}
          ${data.telefon ? `<tr><td class="k">Telefon</td><td class="v">${escape(data.telefon)}</td></tr>` : ""}
          ${data.ceptel ? `<tr><td class="k">Cep Telefonu</td><td class="v">${escape(data.ceptel)}</td></tr>` : ""}
        </table>

        ${data.asistanAdSoyad ? `
          <div class="divider"></div>
          <div class="section-title">Asistan Bilgileri</div>
          <table class="kv" role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td class="k">Ad Soyad</td>
              <td class="v">${escape(data.asistanAdSoyad)}</td>
            </tr>
            ${data.asistanEposta ? `<tr><td class="k">E-posta</td><td class="v">${escape(data.asistanEposta)}</td></tr>` : ""}
            ${data.asistanTelefon ? `<tr><td class="k">Telefon</td><td class="v">${escape(data.asistanTelefon)}</td></tr>` : ""}
          </table>
        ` : ""}

        ${data.adSoyad2 ? `
          <div class="divider"></div>
          <div class="section-title">İkinci Katılımcı</div>
          <table class="kv" role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td class="k">Ad Soyad</td>
              <td class="v">${escape(data.adSoyad2)}</td>
            </tr>
            ${data.eposta2 ? `<tr><td class="k">E-posta</td><td class="v">${escape(data.eposta2)}</td></tr>` : ""}
            ${data.kurumAdi2 ? `<tr><td class="k">Kurum</td><td class="v">${escape(data.kurumAdi2)}</td></tr>` : ""}
            ${data.unvan2 ? `<tr><td class="k">Ünvan</td><td class="v">${escape(data.unvan2)}</td></tr>` : ""}
            ${data.kurumAdresi2 ? `<tr><td class="k">Kurum Adresi</td><td class="v">${escape(data.kurumAdresi2)}</td></tr>` : ""}
            ${data.telefon2 ? `<tr><td class="k">Telefon</td><td class="v">${escape(data.telefon2)}</td></tr>` : ""}
            ${data.ceptel2 ? `<tr><td class="k">Cep Telefonu</td><td class="v">${escape(data.ceptel2)}</td></tr>` : ""}
          </table>
        ` : ""}

        <div class="divider"></div>

        <!-- Fatura -->
        <div class="section-title">Fatura Bilgileri</div>
        <p class="hint">E-fatura/e-arşiv süreçleri için bilgileriniz aşağıdaki gibidir.</p>

        <table class="kv" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td class="k">Fatura Tipi</td>
            <td class="v">${data.invoiceType === "firma" ? "Firma" : "Şahıs"}</td>
          </tr>
          ${data.isEFatura !== undefined ? `<tr><td class="k">E-Fatura</td><td class="v">${data.isEFatura ? "Evet" : "Hayır"}</td></tr>` : ""}

          ${data.invoiceType === "firma"
      ? `
                ${data.firmaUnvani ? `<tr><td class="k">Firma Ünvanı</td><td class="v">${escape(data.firmaUnvani)}</td></tr>` : ""}
                ${data.faturaSehir ? `<tr><td class="k">Şehir</td><td class="v">${escape(data.faturaSehir)}</td></tr>` : ""}
                ${data.faturaIlce ? `<tr><td class="k">İlçe</td><td class="v">${escape(data.faturaIlce)}</td></tr>` : ""}
                ${data.faturaAdres ? `<tr><td class="k">Açık Adres</td><td class="v">${escape(data.faturaAdres)}</td></tr>` : ""}
                ${data.faturaPostaKodu ? `<tr><td class="k">Posta Kodu</td><td class="v">${escape(data.faturaPostaKodu)}</td></tr>` : ""}
                ${data.vergiDairesi ? `<tr><td class="k">Vergi Dairesi</td><td class="v">${escape(data.vergiDairesi)}</td></tr>` : ""}
                ${data.vergiNo ? `<tr><td class="k">Vergi No</td><td class="v">${escape(data.vergiNo)}</td></tr>` : ""}
                ${data.eArsivEmail ? `<tr><td class="k">e-Arşiv E-posta</td><td class="v">${escape(data.eArsivEmail)}</td></tr>` : ""}
              `
      : `
                ${data.ilgiliKisi ? `<tr><td class="k">İlgili Kişi</td><td class="v">${escape(data.ilgiliKisi)}</td></tr>` : ""}
                ${data.sahisFaturaSehir ? `<tr><td class="k">Şehir</td><td class="v">${escape(data.sahisFaturaSehir)}</td></tr>` : ""}
                ${data.sahisFaturaIlce ? `<tr><td class="k">İlçe</td><td class="v">${escape(data.sahisFaturaIlce)}</td></tr>` : ""}
                ${data.sahisFaturaAdres ? `<tr><td class="k">Açık Adres</td><td class="v">${escape(data.sahisFaturaAdres)}</td></tr>` : ""}
                ${data.sahisFaturaPostaKodu ? `<tr><td class="k">Posta Kodu</td><td class="v">${escape(data.sahisFaturaPostaKodu)}</td></tr>` : ""}
                ${data.sahisEposta ? `<tr><td class="k">E-posta</td><td class="v">${escape(data.sahisEposta)}</td></tr>` : ""}
              `
    }
        </table>
        <div class="divider"></div>

        <div class="section-title">İletişim için;</div>
        <p class="contact-block"><strong>EPS EVENT</strong></p>
        <p class="contact-block">Tel: 0530 583 62 92</p>
        <p class="contact-block">e-mail: <a href="mailto:uez2026@epsevent.com">uez2026@epsevent.com</a></p>
        <p class="contact-block">Adres: MERKEZ MAH. KAGITHANE CAD. I OFIS NO: 3 IÇ KAPI NO: 51 KAGITHANE/ ISTANBUL</p>

        <div class="section-title" style="margin-top: 20px;">İPTAL VE İADE ŞARTLARI:</div>
        <ul class="contact-block" style="margin: 0; padding-left: 20px;">
          <li>25 Mart 2026 (dahil) tarihinden önce yapılan iptallerde toplam ödemelerin sadece %50'si iade edilir.</li>
          <li>26 Mart 2026 (dahil) tarihinden itibaren yapılan iptallerde ödemeler iade edilmez. İsim değişikliği yapılabilir.</li>
          <li>Tüm iptaller yazılı olarak tarafımıza iletilmelidir.</li>
        </ul>
      </div>

      <div class="footer">
        <div><strong class="muted">Not:</strong> Bu e-posta otomatik oluşturulmuştur. Lütfen yanıtlamayınız.</div>
        <div class="muted">© UEZ 2026</div>
      </div>

    </div>
  </div>
</body>
</html>
`;
  const textContent = `
 UEZ 2026 Kayıt

Paket Bilgileri:
Paket: ${data.packageTitle} ${data.packageSubtitle || ""}
Fiyat: ${data.packagePrice} TL
Ödeme Yöntemi: ${data.paymentMethod === "kredi" ? "Kredi Kartı" : "Banka Havalesi"}

Katılımcı Bilgileri:
Ad Soyad: ${data.adSoyad}
E-posta: ${data.eposta}
${data.kurumAdi ? `Kurum: ${data.kurumAdi}` : ""}
${data.unvan ? `Ünvan: ${data.unvan}` : ""}
${data.kurumAdresi ? `Kurum Adresi: ${data.kurumAdresi}` : ""}
${data.telefon ? `Telefon: ${data.telefon}` : ""}
${data.ceptel ? `Cep Telefonu: ${data.ceptel}` : ""}

${data.asistanAdSoyad ? `
Asistan Bilgileri:
Ad Soyad: ${data.asistanAdSoyad}
${data.asistanEposta ? `E-posta: ${data.asistanEposta}` : ""}
${data.asistanTelefon ? `Telefon: ${data.asistanTelefon}` : ""}
` : ""}

${data.adSoyad2 ? `
İkinci Katılımcı Bilgileri:
Ad Soyad: ${data.adSoyad2}
${data.eposta2 ? `E-posta: ${data.eposta2}` : ""}
${data.kurumAdi2 ? `Kurum: ${data.kurumAdi2}` : ""}
${data.unvan2 ? `Ünvan: ${data.unvan2}` : ""}
${data.kurumAdresi2 ? `Kurum Adresi: ${data.kurumAdresi2}` : ""}
${data.telefon2 ? `Telefon: ${data.telefon2}` : ""}
${data.ceptel2 ? `Cep Telefonu: ${data.ceptel2}` : ""}
` : ""}

Fatura Bilgileri:
Fatura Tipi: ${data.invoiceType === "firma" ? "Firma" : "Şahıs"}
${data.isEFatura !== undefined ? `E-Fatura: ${data.isEFatura ? "Evet" : "Hayır"}` : ""}
${data.invoiceType === "firma" ? `
${data.firmaUnvani ? `Firma Ünvanı: ${data.firmaUnvani}` : ""}
${data.faturaSehir ? `Şehir: ${data.faturaSehir}` : ""}
${data.faturaIlce ? `İlçe: ${data.faturaIlce}` : ""}
${data.faturaAdres ? `Açık Adres: ${data.faturaAdres}` : ""}
${data.faturaPostaKodu ? `Posta Kodu: ${data.faturaPostaKodu}` : ""}
${data.vergiDairesi ? `Vergi Dairesi: ${data.vergiDairesi}` : ""}
${data.vergiNo ? `Vergi No: ${data.vergiNo}` : ""}
${data.eArsivEmail ? `e-Arşiv E-posta: ${data.eArsivEmail}` : ""}
` : `
${data.ilgiliKisi ? `İlgili Kişi: ${data.ilgiliKisi}` : ""}
${data.sahisFaturaSehir ? `Şehir: ${data.sahisFaturaSehir}` : ""}
${data.sahisFaturaIlce ? `İlçe: ${data.sahisFaturaIlce}` : ""}
${data.sahisFaturaAdres ? `Açık Adres: ${data.sahisFaturaAdres}` : ""}
${data.sahisFaturaPostaKodu ? `Posta Kodu: ${data.sahisFaturaPostaKodu}` : ""}
${data.sahisEposta ? `E-posta: ${data.sahisEposta}` : ""}
`}

İletişim için;
EPS EVENT
Tel: 0530 583 62 92
e-mail: uez2026@epsevent.com
Adres: MERKEZ MAH. KAGITHANE CAD. I OFIS NO: 3 IÇ KAPI NO: 51 KAGITHANE/ ISTANBUL

İPTAL VE İADE ŞARTLARI:
- 25 Mart 2026 (dahil) tarihinden önce yapılan iptallerde toplam ödemelerin sadece %50'si iade edilir.
- 26 Mart 2026 (dahil) tarihinden itibaren yapılan iptallerde ödemeler iade edilmez. İsim değişikliği yapılabilir.
- Tüm iptaller yazılı olarak tarafımıza iletilmelidir.
  `;

  // Kayıt formu: gönderen sabit uezkayit@bigmedia.com.tr
  // Kullanıcı sadece kendisini alıcı görsün; diğer adresler BCC ile gizli kopyalanır
  const mailOptions = {
    from: "uezkayit@bigmedia.com.tr",
    to: data.eposta,
    bcc: "uezkayit@bigmedia.com.tr",
    subject: `UEZ 2026 Başvurunuz Başarıyla Alındı!`,
    html: htmlContent,
    text: textContent,
  };

  await transporter.sendMail(mailOptions);
}

/** Stars of Region formu: formu dolduran kişiye ve uez@bigmedia.com.tr (BCC) "Kaydınız başarılı" maili */
export async function sendStarsOfRegionsEmail(data: Record<string, unknown>): Promise<void> {
  const toEmail = (data.eposta ?? data.email) ? String(data.eposta ?? data.email).trim() : "";
  if (!toEmail) {
    console.warn("[StarsOfRegions] E-posta gönderilmedi: data.eposta/data.email yok veya boş. Keys:", Object.keys(data || {}));
    return;
  }

  let transporter;
  if (process.env.USE_MSMTP === "true") {
    transporter = nodemailer.createTransport({
      sendmail: true,
      newline: "unix",
      path: "/usr/bin/msmtp",
    });
  } else {
    const port = parseInt(process.env.SMTP_PORT || "587");
    const isSecure = port === 465 || process.env.SMTP_SECURE === "true";
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: isSecure,
      requireTLS: !isSecure && port === 587,
      tls: { rejectUnauthorized: false },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  const adSoyad = (data.adSoyad != null ? String(data.adSoyad) : "").trim();
  const merhabaHtml = adSoyad ? `Merhaba Sn. ${escapeHtml(adSoyad)},` : "Merhaba,";
  const merhabaText = adSoyad ? `Merhaba Sn. ${adSoyad},` : "Merhaba,";

  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrap { max-width: 520px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(31, 0, 52, 0.08); }
    .header { background: linear-gradient(135deg, #1F0034 0%, #2d1b4e 100%); color: #fff; padding: 32px 28px; text-align: center; }
    .header .logo { width: 140px; height: auto; margin: 0 auto 16px; display: block; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.92; line-height: 1.5; }
    .body { padding: 32px 28px; text-align: center; }
    .body p { margin: 0; font-size: 16px; line-height: 1.7; color: #334155; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .footer { padding: 0 28px 28px; font-size: 13px; color: #64748b; text-align: center; }
    @media (max-width: 560px) { .header .logo { width: 120px; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <img src="https://api.builder.io/api/v1/image/assets/TEMP/bc1aefcc49920778079094c811fbb255fd0b276e?width=295" alt="UEZ Logo" class="logo" />
        <h1>Stars of Region</h1>
        <p>Kaydınız başarılı.</p>
      </div>
      <div class="body">
        <p>${merhabaHtml}<br><br>Stars of Region programına yaptığınız başvuru kaydınız başarıyla alınmıştır.<br><br>İlginiz için teşekkür ederiz.</p>
        <div class="divider"></div>
        <p style="font-size: 14px; color: #64748b;">UEZ 2026 – Uluslararası Ekonomi Zirvesi</p>
      </div>
      <div class="footer">Bu e-posta otomatik olarak gönderilmiştir.</div>
    </div>
  </div>
</body>
</html>`;

  const textContent = `Stars of Region – Kaydınız Başarılı

${merhabaText}

Stars of Region programına yaptığınız başvuru kaydınız başarıyla alınmıştır.

İlginiz için teşekkür ederiz.

UEZ 2026 – Uluslararası Ekonomi Zirvesi`;

  // Formu dolduran kişiye to; Bigmedia'a BCC ile aynı mail gider (kaydınız başarılı)
  const mailOptions = {
    from: "uez@bigmedia.com.tr",
    to: toEmail,
    bcc: "uez@bigmedia.com.tr",
    subject: "Stars of Region – Kaydınız Başarılı",
    html: htmlContent,
    text: textContent,
  };

  await transporter.sendMail(mailOptions);
}
