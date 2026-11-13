import { useState, useEffect, useCallback } from "react";
import { getAdminBearerToken } from "@/lib/adminSession";

function parsePriceToNumber(priceStr: string | undefined): number {
  if (!priceStr || typeof priceStr !== "string") return 0;
  const cleaned = priceStr.replace(/\s*TL\s*/gi, "").trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function coerceAmount(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.round(v));
  if (typeof v === "bigint") return Math.max(0, Number(v));
  if (typeof v === "string") {
    const t = v.replace(/\s*TL\s*/gi, "").trim();
    if (!t) return 0;
    const cleaned = t.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }
  return 0;
}

export function useRegistrationExternalPayment() {
  const [savedAmount, setSavedAmount] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/registration-external-payment?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { amount?: unknown; entryCount?: unknown };
      const amt = coerceAmount(data.amount);
      setSavedAmount(amt);
      const ec = data.entryCount;
      setEntryCount(typeof ec === "number" && Number.isFinite(ec) ? Math.max(0, Math.floor(ec)) : 0);
      setDraft("");
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onChange = () => {
      void load();
    };
    window.addEventListener("external-payments-changed", onChange);
    return () => window.removeEventListener("external-payments-changed", onChange);
  }, [load]);

  const commit = useCallback(async () => {
    setCommitError(null);
    const token = getAdminBearerToken();
    if (!token) {
      setCommitError("Oturum bulunamadı. Yeniden giriş yapın.");
      return;
    }
    const addition = Math.max(0, Math.round(parsePriceToNumber(draft)));
    if (addition <= 0) {
      setCommitError("Geçerli bir tutar girin.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/registration-external-payment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addition }),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { amount?: unknown; entryCount?: unknown };
        const amt =
          data.amount !== undefined && data.amount !== null
            ? coerceAmount(data.amount)
            : savedAmount + addition;
        setSavedAmount(amt);
        const ec = data.entryCount;
        if (typeof ec === "number" && Number.isFinite(ec)) {
          setEntryCount(Math.max(0, Math.floor(ec)));
        }
        setDraft("");
        setCommitError(null);
      } else {
        let msg = "Kayıt yapılamadı.";
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody?.error) msg = errBody.error;
        } catch {
          void 0;
        }
        setCommitError(msg);
      }
    } catch {
      setCommitError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }, [draft, savedAmount]);

  const setDraftClearError = useCallback((v: string) => {
    setCommitError(null);
    setDraft(v);
  }, []);

  const additionPreview = Math.max(0, Math.round(parsePriceToNumber(draft)));
  const canCommit = additionPreview > 0 && !saving;

  return {
    savedAmount,
    entryCount,
    draft,
    setDraft: setDraftClearError,
    saving,
    commit,
    commitError,
    canCommit,
  };
}
