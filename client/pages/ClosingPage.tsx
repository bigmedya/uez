import "./ClosingPage.css";

export default function ClosingPage() {
  return (
    <main className="uez-closing">
      <img className="uez-closing-logo" src="/logo.png" alt="Uluslararası Ekonomi Zirvesi" />
      <div className="uez-closing-message">
        <h1><span>2027'de</span>{" "}görüşmek üzere!</h1>
        <a href="/arsiv/2026/zirve/">2026 arşivini keşfet <span aria-hidden="true">↗</span></a>
      </div>
    </main>
  );
}
