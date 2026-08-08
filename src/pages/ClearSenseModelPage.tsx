import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const ClearSenseModelViewer = lazy(() => import('../components/ClearSenseModelViewer'));

export function ClearSenseModelPage() {
  const base = import.meta.env.BASE_URL;

  return (
    <main className="standalone-experience model-experience-page">
      <header className="experience-topbar">
        <Link to="/">← 返回全部作品</Link>
        <span>ClearSense / 产品模型</span>
      </header>

      <section className="standalone-model-layout" aria-labelledby="model-page-title">
        <div className="standalone-model-copy">
          <p className="eyebrow">INTERACTIVE 01 / PRODUCT</p>
          <h1 id="model-page-title">拿起产品，<br />看见它如何归位。</h1>
          <p>拖住上方产品将它提起；再次拖动可自由旋转。手机在产品上双指同向上下移动、电脑按住 Shift 拖动可安全升降，接近底座时自动停止。</p>
        </div>
        <Suspense fallback={<div className="standalone-loading" role="status">正在准备3D查看器…</div>}>
          <ClearSenseModelViewer
            modelUrl={`${base}assets/models/clearsense.3dm`}
            libraryPath={`${base}vendor/rhino3dm/`}
            fallbackImage={`${base}assets/projects/clearsense/hero.webp`}
          />
        </Suspense>
      </section>
    </main>
  );
}
