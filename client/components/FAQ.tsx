import { useState } from "react";

const faqs = [
  {
    id: 1,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: 2,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: 3,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: 4,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-8 lg:px-16">
        {/* Title */}
        <h2 className="text-5xl lg:text-7xl font-semibold text-purple-dark text-center mb-16">
          SIKÇA SORULAN SORULAR
        </h2>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="border-b border-gray-border">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="text-2xl lg:text-3xl text-gray-text pr-8">
                  {faq.question}
                </span>
                <svg
                  width="35"
                  height="19"
                  viewBox="0 0 35 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 transition-transform ${openId === faq.id ? "rotate-180" : ""}`}
                >
                  <path
                    d="M17.3958 18.3395C17.7732 18.2825 18.123 18.1081 18.3956 17.841L33.4403 3.20965C33.6284 3.04876 33.7817 2.8511 33.8907 2.62884C33.9996 2.40659 34.0621 2.16442 34.0741 1.91718C34.0861 1.66993 34.0475 1.42281 33.9606 1.19103C33.8737 0.959244 33.7403 0.747672 33.5687 0.569284C33.3971 0.390893 33.1908 0.249469 32.9626 0.153659C32.7343 0.0578476 32.4889 0.0096641 32.2414 0.0121107C31.9939 0.0145573 31.7494 0.0675581 31.5231 0.167861C31.2968 0.268166 31.0934 0.413677 30.9254 0.595426L17.1219 14.0265L3.14559 0.775387C2.97519 0.595829 2.7699 0.452968 2.54231 0.355603C2.31472 0.258239 2.06964 0.208411 1.8221 0.209171C1.57456 0.20993 1.32979 0.261291 1.1028 0.360052C0.87582 0.45881 0.671407 0.602893 0.502118 0.783494C0.332825 0.964093 0.202226 1.17737 0.11833 1.41026C0.0344333 1.64315 -0.00098894 1.89075 0.014238 2.13782C0.0294611 2.38489 0.0950174 2.62622 0.206874 2.84705C0.318731 3.06787 0.474532 3.26353 0.664718 3.42198L15.8977 17.8572C16.0953 18.0448 16.3325 18.1855 16.5918 18.269C16.8511 18.3524 17.1259 18.3766 17.3958 18.3395Z"
                    fill="#4B4596"
                  />
                </svg>
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openId === faq.id ? "max-h-96 pb-6" : "max-h-0"
                }`}
              >
                <p className="text-xl text-gray-text">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
