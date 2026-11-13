/**
 * OneSignal push notification servisi.
 * API key ve App ID environment variable'lardan okunur.
 * PHP OneSignalService örneğine uyumlu, Node/Express için uyarlanmıştır.
 */

const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

export interface OneSignalSendOptions {
  /** Bildirim başlığı */
  title: string;
  /** Bildirim gövde metni */
  message: string;
  /** OneSignal player ID'leri (tek veya çoklu). Verilmezse included_segments kullanılır (varsayılan: All) */
  playerIds?: string[] | string;
  /** Ekstra data (uygulama tarafında kullanılacak key-value) */
  data?: Record<string, unknown>;
  /** Dil kodu (headings/contents için, varsayılan: 'en'). 'tr' eklemek için 'tr' geçebilirsiniz. */
  language?: string;
  /** Tıklanınca açılacak URL (opsiyonel) */
  url?: string;
  /** Segment listesi (playerIds yoksa kullanılır, varsayılan: ['All']) */
  segments?: string[];
}

export interface OneSignalSendResult {
  success: boolean;
  notificationId?: string;
  recipients?: number;
  error?: boolean;
  message?: string;
}


/** App ID + API Key: ayrı env (ONESIGNAL_APP_ID, ONESIGNAL_API_KEY) veya tek satır "AppId::Key". */
function getConfig(): { appId: string; apiKey: string } | null {
  const appIdEnv = process.env.ONESIGNAL_APP_ID?.trim();
  const apiKeyEnv =
    process.env.ONESIGNAL_API_KEY?.trim() ||
    process.env.ONESIGNAL_REST_API_KEY?.trim();
  if (appIdEnv && apiKeyEnv) return { appId: appIdEnv, apiKey: apiKeyEnv };
  const raw = process.env.ONESIGNAL_API_KEY?.trim() || process.env.ONESIGNAL_REST_API_KEY?.trim();
  if (!raw) return null;
  const sep = "::";
  if (raw.includes(sep)) {
    const [appId, apiKey] = raw.split(sep).map((s) => s.trim());
    if (appId && apiKey) return { appId, apiKey };
  }
  if (appIdEnv && raw) return { appId: appIdEnv, apiKey: raw };
  return null;
}

/**
 * OneSignal ile push bildirimi gönderir.
 * Env: ONESIGNAL_APP_ID + ONESIGNAL_API_KEY (veya ONESIGNAL_REST_API_KEY); veya tek satır ONESIGNAL_API_KEY=AppId::Key.
 */
export async function sendNotification(options: OneSignalSendOptions): Promise<OneSignalSendResult> {
  const config = getConfig();
  if (!config) {
    console.warn(
      "[OneSignal] Config yok; bildirim atlanıyor. Env: ONESIGNAL_APP_ID + ONESIGNAL_API_KEY veya ONESIGNAL_API_KEY=AppId::Key"
    );
    return {
      success: false,
      error: true,
      message: "OneSignal config missing (ONESIGNAL_APP_ID + ONESIGNAL_API_KEY)",
    };
  }

  const { title, message, data, language = "en", url, segments = ["All"] } = options;
  let playerIdsArray: string[] | undefined;
  if (options.playerIds !== undefined) {
    playerIdsArray = Array.isArray(options.playerIds)
      ? options.playerIds.filter(Boolean)
      : options.playerIds ? [options.playerIds] : undefined;
  }

  if (playerIdsArray?.length === 0) {
    console.warn("[OneSignal] playerIds boş; bildirim atlanıyor.");
    return {
      success: false,
      error: true,
      message: "Player IDs empty",
    };
  }

  const headings: Record<string, string> = { en: title };
  const contents: Record<string, string> = { en: message };
  if (language !== "en") {
    headings[language] = title;
    contents[language] = message;
  }

  const body: Record<string, unknown> = {
    app_id: config.appId,
    headings,
    contents,
    target_channel: "push",
    ...(playerIdsArray && playerIdsArray.length > 0
      ? { include_player_ids: playerIdsArray }
      : { included_segments: segments }),
  };

  if (url) {
    body.url = url;
  }
  if (data && Object.keys(data).length > 0) {
    body.data = data;
  }

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as {
      id?: string;
      recipients?: number;
      errors?: string[] | Record<string, unknown>;
    };

    if (!response.ok) {
      console.error("[OneSignal] API hatası:", response.status, result);
      return {
        success: false,
        error: true,
        message: Array.isArray(result.errors)
          ? result.errors.join("; ")
          : JSON.stringify(result.errors ?? result),
      };
    }

    const notificationId = result.id;
    const recipients = result.recipients ?? 0;
    console.log("[OneSignal] Bildirim gönderildi:", notificationId, "alıcı:", recipients);
    if (recipients === 0) {
      console.warn(
        "[OneSignal] 0 alıcı — OneSignal Dashboard > Audience bölümünde abone var mı kontrol edin. Segment: All."
      );
    }
    return {
      success: true,
      notificationId,
      recipients,
    };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error("[OneSignal] İstek hatası:", err);
    return {
      success: false,
      error: true,
      message: err,
    };
  }
}

/**
 * Tek bir kullanıcıya (player ID) bildirim gönderir.
 */
export async function sendToUser(
  title: string,
  message: string,
  playerId: string,
  data?: Record<string, unknown>,
  language?: string
): Promise<OneSignalSendResult> {
  return sendNotification({
    title,
    message,
    playerIds: playerId,
    data,
    language,
  });
}
