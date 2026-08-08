import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NightCareDeliveryRequest } from '../components/NightCareModelViewer';

const NightCareModelViewer = lazy(() => import('../components/NightCareModelViewer'));

type MobilePanel = 'terminal' | 'model';

type NightCareMessage = {
  type?: string;
  productId?: string;
  productName?: string;
  delivery?: string;
};

export function NightCareExperiencePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deliveryRequest, setDeliveryRequest] = useState<NightCareDeliveryRequest | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [prototypeVersion, setPrototypeVersion] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('terminal');
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const receivePurchase = (event: MessageEvent<NightCareMessage>) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (data?.type !== 'nightcare:purchase-complete') return;
      if (!data.productId || !data.productName || !['single', 'private', 'kit'].includes(data.delivery || '')) return;
      setDeliveryRequest({
        productId: data.productId,
        productName: data.productName,
        delivery: data.delivery as NightCareDeliveryRequest['delivery'],
        nonce: Date.now(),
      });
      setMobilePanel('model');
    };
    window.addEventListener('message', receivePurchase);
    return () => window.removeEventListener('message', receivePurchase);
  }, []);

  const restartExperience = () => {
    setDeliveryRequest(null);
    setResetSignal((value) => value + 1);
    setPrototypeVersion((value) => value + 1);
    setMobilePanel('terminal');
  };

  return (
    <main className="standalone-experience nightcare-experience-page">
      <header className="experience-topbar nightcare-topbar">
        <Link to="/">← 返回全部作品</Link>
        <span>NightCare / 模型与终端联动</span>
        <button type="button" onClick={restartExperience}>重新开始</button>
      </header>

      <div className="nightcare-mobile-tabs" role="tablist" aria-label="NightCare体验视图">
        <button
          id="nightcare-terminal-tab"
          type="button"
          role="tab"
          aria-selected={mobilePanel === 'terminal'}
          aria-controls="nightcare-terminal-panel"
          onClick={() => setMobilePanel('terminal')}
        >操作终端</button>
        <button
          id="nightcare-model-tab"
          type="button"
          role="tab"
          aria-selected={mobilePanel === 'model'}
          aria-controls="nightcare-model-panel"
          onClick={() => setMobilePanel('model')}
        >查看模型</button>
      </div>

      <section className="nightcare-experience-layout" aria-label="NightCare模型与终端交互体验">
        <div
          id="nightcare-model-panel"
          className={`nightcare-model-pane${mobilePanel === 'model' ? ' is-mobile-active' : ''}`}
          role="tabpanel"
          aria-labelledby="nightcare-model-tab"
        >
          <div className="nightcare-pane-label"><span>01</span> 产品模型与出货反馈</div>
          <Suspense fallback={<div className="standalone-loading" role="status">正在准备3D查看器…</div>}>
            <NightCareModelViewer
              modelUrl={`${base}assets/models/nightcare-optimized.glb`}
              fallbackImage={`${base}assets/projects/nightcare/hero.webp`}
              deliveryRequest={deliveryRequest}
              resetSignal={resetSignal}
            />
          </Suspense>
        </div>

        <div
          id="nightcare-terminal-panel"
          className={`nightcare-terminal-pane${mobilePanel === 'terminal' ? ' is-mobile-active' : ''}`}
          role="tabpanel"
          aria-labelledby="nightcare-terminal-tab"
        >
          <div className="nightcare-pane-label"><span>02</span> 终端界面</div>
          <div className="nightcare-terminal-frame">
            <iframe
              key={prototypeVersion}
              ref={iframeRef}
              src={`${base}interactive/nightcare-ui/index.html?embedded=1&v=${prototypeVersion}`}
              title="NightCare校园夜间健康支持终端交互原型"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
