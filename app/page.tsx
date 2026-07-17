import GanymedeScene from "./GanymedeScene";

export default function Home() {
  return (
    <main className="ganymede" id="experience">
      <GanymedeScene />

      <header className="topbar">
        <a className="wordmark" href="#experience" aria-label="Project Ganymede home">
          <span className="monogram">G</span>
          <span>PROJECT<br />GANYMEDE</span>
        </a>
        <div className="top-actions">
          <span className="mission-code">MISSION / 001</span>
        </div>
      </header>

      <a className="launch-app launch-center" href="#experience">
        Launch App <span aria-hidden="true">↗</span>
      </a>

      <section className="hero-copy" aria-labelledby="hero-title">
        <p className="kicker">A NEW ORBIT BEGINS</p>
        <h1 id="hero-title">PROJECT GANYMEDE</h1>
        <p className="hero-note">Human arrival, thoughtfully designed.</p>
      </section>

      <aside className="object-data" aria-label="Ganymede object data">
        <span>OBJECT / GANYMEDE</span>
        <span>CLASS / MOON</span>
        <span>ORBIT / JUPITER</span>
      </aside>

      <footer className="bottom-bar">
        <span>34° 32′ N · 79° 15′ W</span>
        <span>SCROLL TO EXPLORE <b aria-hidden="true">↓</b></span>
        <span>© 2026 GANYMEDE</span>
      </footer>
    </main>
  );
}
