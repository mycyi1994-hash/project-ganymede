const neptune = String.raw`
                               .      *
             _..-----.._                  .
         _.-'           '-._
      .-'       .---.       '-.
    .'       .-'     '-.       '.
   /       .'  .-"""-.  '.       \
  ;       /   /.......\   \       ;
  |      ;   :::::::::::   ;      |
==+======|==:::::::::::::==|======+==
   '._    \  :::::::::::  /    _.'
  .   '-.__'. ':::::::' .'__.-'      .
          /  '-._____.-'  \
     _.-'       '---'       '-._
 _.-'  _..---============---.._ '-._
<__..-'                         '-..__>
          *              .
`;

const tasks = [
  { number: "01", label: "회사와 팀 알아보기", meta: "8 min", active: true },
  { number: "02", label: "업무 환경 세팅", meta: "12 min" },
  { number: "03", label: "첫 주의 궤도 확인", meta: "5 min" },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="주요 메뉴">
        <a className="brand" href="#top" aria-label="Orbit 온보딩 홈">
          <span className="brand-mark" aria-hidden="true">N.</span>
          <span>NEPTUNE / ONBOARDING</span>
        </a>
        <div className="nav-meta">
          <span className="signal"><i /> SYSTEM ONLINE</span>
          <span className="coordinates">SEOUL · 37.5665° N</span>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>WELCOME TRANSMISSION</span><b>001</b></p>
          <h1>
            새로운 궤도에<br />
            <em>오신 것을 환영합니다.</em>
          </h1>
          <p className="intro">
            낯선 우주도 좋은 지도와 동료가 있으면 금세 익숙해집니다.
            이곳에서 첫날에 필요한 사람, 도구, 문화를 하나씩 만나보세요.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#launch-plan">
              온보딩 시작하기 <span aria-hidden="true">↗</span>
            </a>
            <span className="time-note">EST. TIME<br /><strong>25 MINUTES</strong></span>
          </div>
        </div>

        <div className="planet-stage" aria-label="ASCII 문자로 표현한 해왕성과 고리">
          <div className="orbit-label orbit-label-one"><span>VIII</span> NEPTUNE</div>
          <div className="orbit-label orbit-label-two">ROTATION <span>16H 06M</span></div>
          <pre className="planet" aria-hidden="true">{neptune}</pre>
          <span className="star star-one" aria-hidden="true">+</span>
          <span className="star star-two" aria-hidden="true">·</span>
          <span className="star star-three" aria-hidden="true">✦</span>
          <div className="planet-caption">
            <span>OBJECT / 08</span>
            <span>STATUS / ORBITING</span>
          </div>
        </div>
      </section>

      <section className="launch-plan" id="launch-plan" aria-labelledby="plan-title">
        <div className="section-heading">
          <p>YOUR LAUNCH PLAN</p>
          <h2 id="plan-title">첫날의 항로</h2>
          <span>준비된 순서대로 천천히 따라오세요.</span>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <a className={`task ${task.active ? "active" : ""}`} href="#" key={task.number}>
              <span className="task-number">{task.number}</span>
              <span className="task-label">{task.label}</span>
              <span className="task-meta">{task.meta}</span>
              <span className="task-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      </section>

      <footer>
        <span>NEPTUNE PEOPLE EXPERIENCE</span>
        <span>WELCOME ABOARD · 2026</span>
      </footer>
    </main>
  );
}
