import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function ClearSenseUiPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [prototypeVersion, setPrototypeVersion] = useState(0);
  const base = import.meta.env.BASE_URL;
  const prototypeUrl = `${base}interactive/clearsense-ui/index.html?welcome=1&demo=1&v=${prototypeVersion}`;

  const restartPrototype = () => {
    try {
      iframeRef.current?.contentWindow?.localStorage.removeItem('clearsense-demo');
      iframeRef.current?.contentWindow?.localStorage.removeItem('clearsense-onboarded');
    } catch {
      // Remounting below still restarts the prototype if storage access is blocked.
    }
    setPrototypeVersion((version) => version + 1);
  };

  return (
    <main className="standalone-experience ui-experience-page">
      <header className="experience-topbar">
        <Link to="/">← 返回全部作品</Link>
        <span>ClearSense / UI 体验原型</span>
        <button type="button" onClick={restartPrototype}>重新开始</button>
      </header>

      <section className="phone-stage" aria-label="ClearSense手机应用交互原型">
        <div className="phone-device">
          <span className="phone-speaker" aria-hidden="true" />
          <span className="phone-side phone-side-left" aria-hidden="true" />
          <span className="phone-side phone-side-right" aria-hidden="true" />
          <div className="phone-screen">
            <iframe
              key={prototypeVersion}
              ref={iframeRef}
              src={prototypeUrl}
              title="ClearSense可交互手机应用原型"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
