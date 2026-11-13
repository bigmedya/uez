import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Contract {
  id: number;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  updatedAt: string;
}

export default function ContractPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = i18n.language?.startsWith("en") ? "en" : "tr";
  // Extract slug from pathname (e.g., "/cerez-politikasi" -> "cerez-politikasi")
  const slug = location.pathname.replace(/^\//, "");
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/slug/${slug}?locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          setContract(data);
        } else {
          navigate("/404");
        }
      } catch (error) {
        console.error("Error fetching contract:", error);
        navigate("/404");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchContract();
    } else {
      setLoading(false);
    }
  }, [slug, locale, navigate]);

  // Add data-label attributes to table cells for mobile view
  useEffect(() => {
    if (contract && contentRef.current) {
      const tables = contentRef.current.querySelectorAll("table");
      tables.forEach((table) => {
        const thead = table.querySelector("thead");
        if (thead) {
          // Table with header row
          const headers = thead.querySelectorAll("th");
          const rows = table.querySelectorAll("tbody tr");
          
          headers.forEach((header, index) => {
            const headerText = header.textContent?.trim() || "";
            rows.forEach((row) => {
              const cell = row.querySelectorAll("td")[index];
              if (cell) {
                cell.setAttribute("data-label", headerText);
              }
            });
          });
        } else {
          // Table without header (like Veri Sorumlusu table)
          const rows = table.querySelectorAll("tbody tr");
          rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            if (cells.length === 2) {
              const label = cells[0].textContent?.trim() || "";
              cells[1].setAttribute("data-label", label);
            }
          });
        }
      });
    }
  }, [contract]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="relative bg-purple-dark">
          <Header />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const dateLocale = locale === "en" ? "en-US" : "tr-TR";
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="relative bg-purple-dark">
        <Header />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-dark via-purple-primary to-purple-dark overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 break-words">
            {contract.title}
          </h1>
          <p className="text-purple-accent text-base sm:text-lg">
            {t("contract.lastUpdate")}: {formatDate(contract.updatedAt)}
          </p>
        </div>
      </section>

      {/* Content Section - ortalanmış, mobil ve web */}
      <section className="flex-1 py-8 sm:py-12 md:py-16 bg-white flex justify-center">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col items-center">
          <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 lg:p-16 text-left">
            <style>{`
              /* Desktop: Normal table view */
              .contract-content table {
                display: table;
                width: 100%;
                border-collapse: collapse;
              }
              
              /* Mobile: Card view */
              @media (max-width: 768px) {
                .contract-content table {
                  display: block !important;
                  width: 100% !important;
                  border-collapse: separate !important;
                }
                
                .contract-content thead {
                  display: none !important;
                }
                
                .contract-content tbody {
                  display: block !important;
                  width: 100% !important;
                }
                
                .contract-content tr {
                  display: block !important;
                  width: 100% !important;
                  border: 1px solid #ddd !important;
                  margin-bottom: 1rem !important;
                  border-radius: 8px !important;
                  background: #fff !important;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                  padding: 0 !important;
                }
                
                .contract-content td {
                  display: block !important;
                  width: 100% !important;
                  border: none !important;
                  border-bottom: 1px solid #eee !important;
                  padding: 12px !important;
                  text-align: left !important;
                  position: relative !important;
                  font-size: 0.875rem !important;
                  background-color: transparent !important;
                }
                
                .contract-content td:first-child {
                  background-color: #f3f4f6 !important;
                  font-weight: bold !important;
                }
                
                .contract-content td:before {
                  content: attr(data-label) ": ";
                  font-weight: bold;
                  color: #374151;
                  display: inline-block;
                  margin-right: 8px;
                }
                
                /* For tables without thead (like Veri Sorumlusu), hide first column and show label on second */
                .contract-content table:not(:has(thead)) td:first-child {
                  display: none !important;
                }
                
                .contract-content table:not(:has(thead)) td:last-child:before {
                  content: attr(data-label) ": ";
                  font-weight: bold;
                  color: #374151;
                  display: block;
                  margin-bottom: 4px;
                }
                
                .contract-content td:last-child {
                  border-bottom: 0 !important;
                }
              }
            `}</style>
            <div
              ref={contentRef}
              className="contract-content prose prose-lg max-w-none 
                prose-headings:text-gray-900 prose-headings:font-bold 
                prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-0
                prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-purple-dark
                prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-purple-dark
                prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-4
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-li:text-gray-700 prose-li:mb-2 prose-li:leading-relaxed
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                prose-a:text-purple-primary prose-a:underline prose-a:hover:text-purple-dark
                prose-table:w-full prose-table:border-collapse prose-table:my-6
                prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:text-gray-900
                prose-td:border prose-td:border-gray-300 prose-td:p-3 prose-td:text-gray-700
                prose-blockquote:border-l-4 prose-blockquote:border-purple-primary prose-blockquote:pl-4 prose-blockquote:italic
                prose-em:text-gray-600"
              dangerouslySetInnerHTML={{ __html: contract.content }}
            />
          </div>

          {/* Back Link */}
          <div className="mt-8 sm:mt-12 w-full flex justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-purple-primary hover:text-purple-dark transition-colors font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("contract.backToHome")}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

