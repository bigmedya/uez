/**
 * HTML içeriğini temizleyip düz metne çeviren fonksiyon
 * - HTML etiketlerini kaldırır
 * - <br> ve <br/> etiketlerini yeni satır karakterine çevirir
 * - <p>, <div> gibi blok elementlerini paragraf olarak işler (paragraflar arası boşluk)
 * - HTML entity'lerini decode eder
 * - Çoklu boşlukları temizler
 * - Paragraflar arasında uygun boşluk bırakır
 * - HTML içindeki gereksiz yeni satırları kaldırır (cümleleri yarıda kesmemek için)
 */
export function cleanHtmlToText(html: string): string {
  if (!html) return "";
  
  // Geçici bir DOM elementi oluştur
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  
  // <br> ve <br/> etiketlerini yeni satır karakterine çevir
  const brElements = tempDiv.querySelectorAll("br");
  brElements.forEach((br) => {
    br.replaceWith("\n");
  });
  
  // Blok elementlerini işle - her birinin içeriğini ayrı ayrı al
  // Böylece içerideki gereksiz yeni satırları kaldırabiliriz
  const blockElements = tempDiv.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6");
  const paragraphs: string[] = [];
  
  if (blockElements.length > 0) {
    // Blok elementler varsa, her birinin içeriğini ayrı ayrı işle
    blockElements.forEach((el) => {
      // Element'in içindeki tüm metni al (alt elementler dahil)
      let paragraphText = el.textContent || "";
      
      // İçerideki gereksiz yeni satırları boşluğa çevir
      paragraphText = paragraphText.replace(/\s+/g, " ").trim();
      
      if (paragraphText) {
        paragraphs.push(paragraphText);
      }
    });
    
    // Paragrafları birleştir (her paragraf arasında yeni satır)
    let text = paragraphs.join("\n\n");
    
    // HTML entity'lerini decode et
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, "–")
      .replace(/&#8212;/g, "—");
    
    // Çoklu boşlukları tek boşluğa çevir
    text = text.replace(/[ \t]+/g, " ");
    
    // Çoklu yeni satırları normalize et (maksimum 2 ardışık yeni satır)
    text = text.replace(/\n{3,}/g, "\n\n");
    
    // Başındaki ve sonundaki boşlukları temizle
    return text.trim();
  } else {
    // Blok element yoksa, normal işleme devam et
    let text = tempDiv.textContent || "";
    
    // HTML içindeki gereksiz yeni satırları kaldır (cümleleri yarıda kesmemek için)
    // Sadece ardışık 2+ yeni satırı koru (paragraflar arası boşluk için)
    // Tek yeni satırları boşluğa çevir
    text = text.replace(/([^\n])\n([^\n])/g, "$1 $2");
    
    // HTML entity'lerini decode et
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, "–")
      .replace(/&#8212;/g, "—");
    
    // Çoklu boşlukları tek boşluğa çevir (ama yeni satırları koru)
    text = text.replace(/[ \t]+/g, " ");
    
    // Satır sonlarındaki boşlukları temizle
    text = text.replace(/ +\n/g, "\n");
    
    // Çoklu yeni satırları normalize et (maksimum 2 ardışık yeni satır)
    text = text.replace(/\n{3,}/g, "\n\n");
    
    // Başındaki ve sonundaki boşlukları temizle
    return text.trim();
  }
}
