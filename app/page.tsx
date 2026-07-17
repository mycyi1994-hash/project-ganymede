import GanymedeScene from "./GanymedeScene";

const navigation = [
  ["Mission", "#mission"],
  ["Technology", "#technology"],
  ["Timeline", "#timeline"],
  ["About", "#about"],
];

const capabilities = [
  {
    index: "01",
    title: "Mission Architecture",
    text: "Turn complex objectives, constraints, and crew dependencies into one coordinated operational plan.",
  },
  {
    index: "02",
    title: "Autonomous Planning",
    text: "Continuously adapt schedules and resources as mission conditions change across teams and time zones.",
  },
  {
    index: "03",
    title: "Crew Readiness",
    text: "Guide every arrival from first briefing to flight-ready status with a clear, shared mission context.",
  },
];

const phases = [
  ["T-120", "Alignment", "Objectives and crew roles confirmed"],
  ["T-060", "Simulation", "Systems and scenarios validated"],
  ["T-014", "Readiness", "Final dependencies resolved"],
  ["T+000", "Launch", "Mission control goes live"],
];

export default function Home() {
  return (
    <main className="ganymede">
      <section className="hero-shell" id="mission" aria-labelledby="hero-title">
        <GanymedeScene />

        <header className="topbar">
          <a className="wordmark" href="#mission" aria-label="Project Ganymede home">
            <span className="monogram">G</span>
            <span>PROJECT<br />GANYMEDE</span>
          </a>

          <nav className="site-nav" aria-label="Primary navigation">
            {navigation.map(([label, href]) => (
              <a key={label} href={href}>{label}</a>
            ))}
          </nav>

          <div className="top-actions">
            <span className="mission-code">MISSION / 001</span>
            <a className="enter-app" href="#launch">Enter App <span aria-hidden="true">&#8599;</span></a>
          </div>
        </header>

        <section className="hero-copy">
          <p className="kicker">A NEW ORBIT BEGINS</p>
          <h1 id="hero-title"><span>PROJECT</span><span>GANYMEDE</span></h1>
          <p className="hero-note">An autonomous mission platform for planning humanity&apos;s next frontier.</p>
          <div className="hero-actions" id="launch">
            <a className="launch-app" href="#technology">
              Launch Mission <span aria-hidden="true">&#8599;</span>
            </a>
            <a className="explore-project" href="#mission-overview">Explore the Project <span aria-hidden="true">&#8595;</span></a>
          </div>
        </section>

        <aside className="object-data" aria-label="Ganymede object data">
          <span>OBJECT / GANYMEDE</span>
          <span>CLASS / MOON</span>
          <span>ORBIT / JUPITER</span>
        </aside>

        <footer className="bottom-bar">
          <span>34&#176; 32&apos; N / 79&#176; 15&apos; W</span>
          <a href="#mission-overview">SCROLL TO EXPLORE <b aria-hidden="true">&#8595;</b></a>
          <span>&copy; 2026 GANYMEDE</span>
        </footer>
      </section>

      <section className="mission-overview" id="mission-overview" aria-labelledby="overview-title">
        <div className="section-intro">
          <p className="section-label">MISSION / OVERVIEW</p>
          <div>
            <h2 id="overview-title">From first contact<br />to flight readiness.</h2>
            <p>Ganymede gives distributed teams one calm, precise operating layer for the decisions that shape a mission before launch.</p>
          </div>
        </div>

        <div className="capability-grid" id="technology">
          {capabilities.map((capability) => (
            <article key={capability.index}>
              <span>{capability.index}</span>
              <h3>{capability.title}</h3>
              <p>{capability.text}</p>
            </article>
          ))}
        </div>

        <section className="timeline-section" id="timeline" aria-labelledby="timeline-title">
          <div className="timeline-heading">
            <p className="section-label">MISSION / TIMELINE</p>
            <h2 id="timeline-title">A clear path<br />to launch.</h2>
          </div>
          <ol className="timeline-list">
            {phases.map(([time, title, detail]) => (
              <li key={time}>
                <span>{time}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <p className="section-label">PROJECT / GANYMEDE</p>
          <h2 id="about-title">Human arrival,<br />thoughtfully designed.</h2>
          <p>Built for teams working beyond familiar boundaries. Ganymede brings planning, readiness, and mission knowledge into one deliberate experience.</p>
          <a className="launch-app" href="#launch">Enter Mission Control <span aria-hidden="true">&#8599;</span></a>
        </section>

        <footer className="site-footer">
          <span>PROJECT GANYMEDE</span>
          <span>MISSION SYSTEMS / 2026</span>
        </footer>
      </section>
    </main>
  );
}
