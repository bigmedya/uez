import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Plus, CheckCircle, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const PWA_MODAL_DISMISSED_KEY = "uez-pwa-install-modal-dismissed";
const PWA_MODAL_ACCEPTED_KEY = "uez-pwa-install-accepted"; 
const PWA_MODAL_DISMISSED_DAYS = 1;

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
}

function wasAcceptedPermanently(): boolean {
  try {
    return localStorage.getItem(PWA_MODAL_ACCEPTED_KEY) === "1";
  } catch {
    return false;
  }
}

function wasDismissedRecently(): boolean {
  if (wasAcceptedPermanently()) return true;
  try {
    const raw = localStorage.getItem(PWA_MODAL_DISMISSED_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (Number.isNaN(at)) return false;
    const days = (Date.now() - at) / (24 * 60 * 60 * 1000);
    return days < PWA_MODAL_DISMISSED_DAYS;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(PWA_MODAL_DISMISSED_KEY, String(Date.now()));
  } catch {}
}

function setAcceptedPermanently(): void {
  try {
    localStorage.setItem(PWA_MODAL_ACCEPTED_KEY, "1");
  } catch {}
}

function clearAcceptedPermanently(): void {
  try {
    localStorage.removeItem(PWA_MODAL_ACCEPTED_KEY);
  } catch {}
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const IOS_STEPS = [
  { icon: Share2, label: "Tarayıcıda alttaki Paylaş butonuna dokunun", num: 1 },
  { icon: Plus, label: "'Ana Ekrana Ekle' seçeneğini seçin", num: 2 },
  { icon: CheckCircle, label: "Sağ üstten 'Ekle' deyin", num: 3 },
];

const ANDROID_STEPS = [
  { icon: MoreVertical, label: "Sağ üstteki menü (üç nokta) butonuna dokunun", num: 1 },
  { icon: Plus, label: "'Uygulamayı yükle' veya 'Ana ekrana ekle' seçeneğini seçin", num: 2 },
  { icon: CheckCircle, label: "Açılan pencerede 'Yükle' veya 'Ekle' deyin", num: 3 },
];

export function PWAInstallModal() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const promptHandlerRef = useRef((e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    setDeferredPrompt(e);
    if (isStandalone()) return;
    if (pathnameRef.current !== "/m" || !isMobile()) return;
    clearAcceptedPermanently();
    setShowInstructions(false);
    setOpen(true);
  });

  // Sadece /m sayfasında modal göster
  const isOnMPage = pathname === "/m";

  useEffect(() => {
    const handler = (e: Event) => promptHandlerRef.current(e as BeforeInstallPromptEvent);
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!isOnMPage || !isMobile() || isStandalone() || wasDismissedRecently()) return;
    const t = setTimeout(() => setOpen(true), 6_000);
    return () => clearTimeout(t);
  }, [isOnMPage]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [open]);

  const handleConfirm = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setAcceptedPermanently();
        setOpen(false);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIOS()) {
      setShowInstructions(true);
      return;
    }
    if (isAndroid()) {
      setShowInstructions(true);
      return;
    }
    setAcceptedPermanently();
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    setShowInstructions(false);
    setDismissed();
  };

  if (!isOnMPage) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDismissed(); }}>
      <DialogContent
        className={cn(
          "max-w-sm sm:max-w-md p-0 gap-0 overflow-hidden",
          "border-0 shadow-xl rounded-2xl"
        )}
      >
        {/* Üst bant: logo + başlık */}
        <div className="bg-[#4C1D95] px-5 pt-5 pb-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="" className="h-14 w-auto object-contain" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white m-0">
                {showInstructions ? "Ana ekrana nasıl eklenir?" : "UEZ 2026"}
              </DialogTitle>
              <DialogDescription className="text-white/85 text-sm mt-0.5">
                {showInstructions ? "Aşağıdaki adımları izleyin" : "Ana ekrana ekleyerek hızlı erişim sağlayın."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {showInstructions ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Bildirim almak ve daha hızlı erişmek için:
              </p>
              <ol className="space-y-3">
                {(isIOS() ? IOS_STEPS : ANDROID_STEPS).map(({ icon: Icon, label, num }) => (
                  <li key={num} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6B46C1] text-white flex items-center justify-center text-sm font-semibold">
                      {num}
                    </span>
                    <div className="flex gap-2 pt-0.5">
                      <Icon className="h-5 w-5 text-[#6B46C1] flex-shrink-0 mt-0.5" aria-hidden />
                      <span className="text-sm text-foreground">{label}</span>
                    </div>
                  </li>
                ))}
              </ol>
              {isIOS() ? (
                <p className="text-xs text-muted-foreground pt-1">
                  Paylaş butonu Safari'de alttaki araç çubuğunda, ortada yer alır.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground pt-1">
                  Chrome'da menü sağ üstte üç nokta (⋮) ile açılır. Samsung Internet veya diğer tarayıcılarda da benzer "Ana ekrana ekle" seçeneği menüde yer alır.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Uygulamamızı yükleyerek bildirimleri anında alabilir ve siteye tek tıkla hızlıca erişebilirsiniz.
              </p>
              {isIOS() && (
                <div className="mt-4 rounded-xl bg-muted/60 p-3 border border-border/50">
                  <p className="text-xs font-medium text-foreground mb-2">Nasıl eklenir?</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#6B46C1] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                      Paylaş → Ana Ekrana Ekle → Ekle
                    </li>
                  </ul>
                </div>
              )}
              {isAndroid() && !deferredPrompt && (
                <div className="mt-4 rounded-xl bg-muted/60 p-3 border border-border/50">
                  <p className="text-xs font-medium text-foreground mb-2">Nasıl eklenir?</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#6B46C1] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                      Menü (⋮) → Uygulamayı yükle / Ana ekrana ekle
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-5 pb-5 pt-0 flex-row gap-2 sm:gap-2">
          {showInstructions ? (
            <Button
              onClick={() => { setAcceptedPermanently(); setOpen(false); setShowInstructions(false); }}
              size="sm"
              className="w-full rounded-xl h-9 text-sm bg-[#6B46C1] hover:bg-[#5a3aa3] transition-colors"
            >
              Tamam
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="flex-1 rounded-xl h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Daha sonra
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="flex-1 rounded-xl h-9 text-sm bg-[#6B46C1] hover:bg-[#5a3aa3] transition-colors"
              >
                Evet, yükle
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
