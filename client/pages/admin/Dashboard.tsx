import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CreditCard,
  Loader2,
  Calendar,
  ClipboardList,
  Mic2,
} from "lucide-react";
import RegistrationPaymentStatsGrid from "@/components/admin/RegistrationPaymentStatsGrid";

interface FormResponse {
  id: number;
  formType: string;
  formName: string;
  data: Record<string, string>;
  submittedAt: string;
  createdAt: string;
}

interface ProgramScheduleItem {
  id: number;
  time: string;
  title: string;
  note?: string;
  speakerIds?: number[];
  speakerNames?: string[];
  speakers?: { id: number; name: string; title?: string }[];
}

interface ProgramDay {
  id: number;
  title: string;
  slug?: string;
  order: number;
  scheduleItems: ProgramScheduleItem[];
}

interface ProgramData {
  days: ProgramDay[];
  categories?: unknown[];
  updatedAt?: string;
}

const PROGRAM_YEAR = 2026;

export default function Dashboard() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/forms/responses?formType=kayit");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setResponses(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) setResponses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProgram() {
      try {
        const res = await fetch(`/api/program?year=${PROGRAM_YEAR}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setProgram(data?.days ? { days: data.days } : null);
        }
      } catch {
        if (!cancelled) setProgram(null);
      }
    }
    loadProgram();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 px-3 py-4 sm:px-0 sm:py-0">
      <h1 className="text-xl font-bold text-gray-800 mb-4 sm:text-2xl sm:mb-6">Dashboard</h1>
      <RegistrationPaymentStatsGrid
        responses={responses}
        showManualSections={false}
        className="mb-6 sm:mb-8"
      />

      {/* Hızlı İşlemler */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-4 sm:mt-8 sm:p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 sm:text-lg sm:mb-4">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/uezyonetim/konusmacilar"
            className="flex flex-col min-h-[88px] justify-center p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-primary transition-colors text-left sm:min-h-0 sm:p-4"
          >
            <Users className="w-6 h-6 text-purple-primary mb-2 shrink-0" />
            <span className="text-xs font-medium text-gray-800 sm:text-sm line-clamp-2">
              Konuşmacı Ekle
            </span>
          </Link>
          <Link
            to="/uezyonetim/kayitlar"
            className="flex flex-col min-h-[88px] justify-center p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-primary transition-colors text-left sm:min-h-0 sm:p-4"
          >
            <CreditCard className="w-6 h-6 text-purple-primary mb-2 shrink-0" />
            <span className="text-xs font-medium text-gray-800 sm:text-sm line-clamp-2">
              Ödeme Kontrolü
            </span>
          </Link>
          <Link
            to="/uezyonetim/program"
            className="flex flex-col min-h-[88px] justify-center p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-primary transition-colors text-left sm:min-h-0 sm:p-4"
          >
            <Calendar className="w-6 h-6 text-purple-primary mb-2 shrink-0" />
            <span className="text-xs font-medium text-gray-800 sm:text-sm line-clamp-2">
              Program Düzenle
            </span>
          </Link>
          <Link
            to="/uezyonetim/kayitlar"
            className="flex flex-col min-h-[88px] justify-center p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-primary transition-colors text-left sm:min-h-0 sm:p-4"
          >
            <ClipboardList className="w-6 h-6 text-purple-primary mb-2 shrink-0" />
            <span className="text-xs font-medium text-gray-800 sm:text-sm line-clamp-2">
              Kayıt Listesi
            </span>
          </Link>
        </div>
      </div>

      {/* 2026 Konuşmacı Programı */}
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
            {PROGRAM_YEAR} Konuşmacı Programı
          </h2>
          <Link
            to="/uezyonetim/program"
            className="text-sm text-purple-primary hover:underline shrink-0"
          >
            Programı düzenle
          </Link>
        </div>
        {program?.days && program.days.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {program.days
              .sort((a, b) => a.order - b.order)
              .map((day) => (
                <div
                  key={day.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-primary shrink-0" />
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                        {day.title}
                      </h3>
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-50 max-h-[280px] overflow-y-auto">
                    {(day.scheduleItems || []).map((item) => (
                      <li key={item.id} className="px-4 py-2.5 text-left">
                        <p className="text-xs font-medium text-purple-primary">
                          {item.time}
                        </p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5 line-clamp-2">
                          {item.title}
                        </p>
                        {item.speakerNames?.length ? (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {item.speakerNames.join(", ")}
                          </p>
                        ) : item.speakers?.length ? (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {item.speakers.map((s) => s.name).join(", ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <Mic2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              {PROGRAM_YEAR} programı henüz eklenmemiş veya yükleniyor.
            </p>
            <Link
              to="/uezyonetim/program"
              className="text-sm font-medium text-purple-primary hover:underline"
            >
              Programı düzenle →
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}


