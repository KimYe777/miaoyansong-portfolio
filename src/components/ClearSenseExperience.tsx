import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const ClearSenseModelViewer = lazy(() => import('./ClearSenseModelViewer'));

function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: '900px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  return { ref, near };
}

export function ClearSenseExperience() {
  const modelMount = useNearViewport<HTMLDivElement>();
  const prototypeMount = useNearViewport<HTMLDivElement>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [prototypeVersion, setPrototypeVersion] = useState(0);
  const base = import.meta.env.BASE_URL;
  const prototypeUrl = `${base}interactive/clearsense-ui/index.html?welcome=1&demo=1&v=${prototypeVersion}`;

  const restartPrototype = () => {
    try {
      iframeRef.current?.contentWindow?.localStorage.removeItem('clearsense-demo');
      iframeRef.current?.contentWindow?.localStorage.removeItem('clearsense-onboarded');
    } catch {
      // The standalone link remains available if browser sandboxing blocks storage access.
    }
    setPrototypeVersion((version) => version + 1);
  };

  return (
    <section className="project-experience" aria-labelledby="experience-title">
      <header className="experience-heading page-shell">
        <p className="eyebrow">原作品集之后 / 交互体验</p>
        <h2 id="experience-title">从页面继续，<br />亲手体验产品。</h2>
        <p>模型和界面均来自项目交付文件；这里不替代前面的作品集，只提供进一步操作。</p>
      </header>

      <article className="experience-block model-experience page-shell" aria-labelledby="model-title">
        <div className="experience-index">
          <span>INTERACTIVE 01</span>
          <strong id="model-title">产品模型</strong>
        </div>
        <div className="experience-content" ref={modelMount.ref}>
          {modelMount.near ? (
            <Suspense fallback={<div className="experience-placeholder" role="status">正在准备3D查看器…</div>}>
              <ClearSenseModelViewer
                modelUrl={`${base}assets/models/clearsense.3dm`}
                libraryPath={`${base}vendor/rhino3dm/`}
                fallbackImage={`${base}assets/projects/clearsense/hero.webp`}
              />
            </Suspense>
          ) : <div className="experience-placeholder">滚动到这里后加载3D模型</div>}
        </div>
      </article>

      <article className="experience-block prototype-experience page-shell" aria-labelledby="prototype-title">
        <div className="experience-index">
          <span>INTERACTIVE 02</span>
          <strong id="prototype-title">UI体验原型</strong>
        </div>
        <div className="experience-content" ref={prototypeMount.ref}>
          <div className="prototype-toolbar">
            <p>推荐路径：开始使用 → 高风险演示 → 查看判断 → 行动建议 → 记录感受</p>
            <div>
              <button type="button" onClick={restartPrototype}>重新开始</button>
              <a href={prototypeUrl} target="_blank" rel="noreferrer">在新窗口打开 ↗</a>
            </div>
          </div>
          {prototypeMount.near ? (
            <iframe
              key={prototypeVersion}
              ref={iframeRef}
              className="prototype-frame"
              src={prototypeUrl}
              title="ClearSense可交互UI原型"
              loading="lazy"
            />
          ) : <div className="experience-placeholder">滚动到这里后加载UI原型</div>}
        </div>
      </article>
    </section>
  );
}
