import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type ProjectUiPageProps = {
  projectName: string;
  prototypePath: string;
  theme: 'renteye' | 'wander';
};

function ProjectUiPage({ projectName, prototypePath, theme }: ProjectUiPageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [prototypeVersion, setPrototypeVersion] = useState(0);
  const base = import.meta.env.BASE_URL;
  const prototypeUrl = `${base}${prototypePath}?portfolioVersion=${prototypeVersion}`;

  const adaptEmbeddedPrototype = () => {
    if (theme !== 'wander') return;
    const document = iframeRef.current?.contentDocument;
    const embeddedWindow = iframeRef.current?.contentWindow;
    if (!document || !embeddedWindow) return;

    if (!document.getElementById('portfolio-wander-embed')) {
      const style = document.createElement('style');
      style.id = 'portfolio-wander-embed';
      style.textContent = `
      html, body, #root, #root > div { width: 100% !important; height: 100% !important; min-height: 0 !important; overflow: hidden !important; }
      .device-menu-bar, .phone-bezel { display: none !important; }
      .phone-stage { width: 100% !important; height: 100% !important; min-height: 0 !important; padding: 0 !important; display: block !important; }
      .phone-scale-box, .phone-device {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-width: none !important;
        max-height: none !important;
        transform: none !important;
      }
      .device-screen {
        position: absolute !important;
        top: 50vh !important;
        left: 50vw !important;
        right: auto !important;
        bottom: auto !important;
        width: 394px !important;
        height: 852px !important;
        border-radius: 0 !important;
        transform: translate(-50%, -50%) scale(var(--portfolio-wander-scale, 1)) !important;
        transform-origin: center !important;
      }
      .mobile-app-viewport, .mobile-scroll { width: 100% !important; height: 100% !important; }
    `;
      document.head.appendChild(style);
    }

    const fitPrototype = () => {
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      const scale = Math.min(viewportWidth / 394, viewportHeight / 852);
      document.documentElement.style.setProperty('--portfolio-wander-scale', String(scale));
    };

    fitPrototype();
    embeddedWindow.addEventListener('resize', fitPrototype, { passive: true });
  };

  return (
    <main className={`standalone-experience ui-experience-page theme-${theme}`}>
      <header className="experience-topbar">
        <Link to="/">← 返回全部作品</Link>
        <span>{projectName} / UI 体验原型</span>
        <button type="button" onClick={() => setPrototypeVersion((version) => version + 1)}>
          重新开始
        </button>
      </header>

      <section className="phone-stage" aria-label={`${projectName}手机应用交互原型`}>
        <div className="phone-device">
          <span className="phone-speaker" aria-hidden="true" />
          <span className="phone-side phone-side-left" aria-hidden="true" />
          <span className="phone-side phone-side-right" aria-hidden="true" />
          <div className="phone-screen">
            <iframe
              key={prototypeVersion}
              ref={iframeRef}
              src={prototypeUrl}
              title={`${projectName}可交互手机应用原型`}
              onLoad={adaptEmbeddedPrototype}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export function RentEyeUiPage() {
  return <ProjectUiPage projectName="租前眼" prototypePath="interactive/renteye-ui/index.html" theme="renteye" />;
}

export function WanderUiPage() {
  return <ProjectUiPage projectName="出去晃晃" prototypePath="interactive/wander-ui/index.html" theme="wander" />;
}
