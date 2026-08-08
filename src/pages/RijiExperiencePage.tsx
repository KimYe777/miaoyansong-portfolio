import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RijiPrintRequest, RijiShare } from '../components/RijiModelViewer';

const RijiModelViewer = lazy(() => import('../components/RijiModelViewer'));

type InterfacePanel = 'terminal' | 'mobile';
type MobilePanel = 'model' | InterfacePanel;
type RijiMessage = { type?: string; share?: RijiShare };

const isRijiShare = (share: RijiMessage['share']): share is RijiShare => Boolean(
  share?.id && share.title && share.date && share.time && share.sender && share.message,
);

export function RijiExperiencePage() {
  const terminalRef = useRef<HTMLIFrameElement>(null);
  const mobileRef = useRef<HTMLIFrameElement>(null);
  const [interfacePanel, setInterfacePanel] = useState<InterfacePanel>('terminal');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('terminal');
  const [unread, setUnread] = useState(false);
  const [currentShare, setCurrentShare] = useState<RijiShare | null>(null);
  const [printRequest, setPrintRequest] = useState<RijiPrintRequest | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [prototypeVersion, setPrototypeVersion] = useState(0);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const receive = (event: MessageEvent<RijiMessage>) => {
      if (event.origin !== window.location.origin) return;
      const fromMobile = event.source === mobileRef.current?.contentWindow;
      const fromTerminal = event.source === terminalRef.current?.contentWindow;
      if (!fromMobile && !fromTerminal) return;

      if (fromMobile && event.data?.type === 'riji:share-complete') {
        if (!isRijiShare(event.data.share)) return;
        setCurrentShare(event.data.share);
        setUnread(true);
        setPrintRequest(null);
        setResetSignal((value) => value + 1);
        terminalRef.current?.contentWindow?.postMessage(
          { type: 'riji:incoming-photo', share: event.data.share },
          window.location.origin,
        );
      }
      if (fromTerminal && event.data?.type === 'riji:print-start') {
        if (!isRijiShare(event.data.share)) return;
        setCurrentShare(event.data.share);
        setUnread(false);
        setPrintRequest({ nonce: Date.now(), share: event.data.share });
        if (window.matchMedia('(max-width: 700px)').matches) setMobilePanel('model');
      }
      if (fromTerminal && event.data?.type === 'riji:photo-taken') {
        setPrintRequest(null);
        setResetSignal((value) => value + 1);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  const chooseInterface = (panel: InterfacePanel) => {
    setInterfacePanel(panel);
    setMobilePanel(panel);
    if (panel === 'terminal') setUnread(false);
  };

  const restartExperience = () => {
    setInterfacePanel('terminal');
    setMobilePanel('terminal');
    setUnread(false);
    setCurrentShare(null);
    setPrintRequest(null);
    setResetSignal((value) => value + 1);
    setPrototypeVersion((value) => value + 1);
  };

  const takePhoto = () => {
    setPrintRequest(null);
    setResetSignal((value) => value + 1);
    terminalRef.current?.contentWindow?.postMessage({ type: 'riji:photo-taken' }, window.location.origin);
  };

  return (
    <main className="standalone-experience riji-experience-page">
      <header className="experience-topbar riji-topbar">
        <Link to="/">← 返回全部作品</Link>
        <span>日迹 / 模型与双端联动</span>
        <button type="button" onClick={restartExperience}>重新开始</button>
      </header>

      <div className="riji-mobile-tabs" role="tablist" aria-label="日迹体验视图">
        {(['model', 'terminal', 'mobile'] as const).map((panel) => (
          <button
            key={panel}
            id={`riji-${panel}-tab`}
            type="button"
            role="tab"
            aria-selected={mobilePanel === panel}
            aria-controls={`riji-${panel}-panel`}
            onClick={() => panel === 'model' ? setMobilePanel('model') : chooseInterface(panel)}
          >{panel === 'model' ? '产品模型' : panel === 'terminal' ? '老人终端' : '家人手机'}{panel === 'terminal' && unread ? <b aria-label="1条新照片">1</b> : null}</button>
        ))}
      </div>

      <section className="riji-experience-layout" aria-label="日迹模型、老人终端与家人手机联动体验">
        <div id="riji-model-panel" className={`riji-model-pane${mobilePanel === 'model' ? ' is-mobile-active' : ''}`} role="tabpanel" aria-labelledby="riji-model-tab">
          <div className="riji-pane-heading">
            <div><span>01</span><strong>实体产品</strong></div>
            <p>拖动旋转 · 双指缩放 · 点击底部抽屉开合</p>
          </div>
          <Suspense fallback={<div className="standalone-loading" role="status">正在准备3D查看器…</div>}>
            <RijiModelViewer
              modelUrl={`${base}assets/models/riji-optimized.glb`}
              photoUrl={`${base}interactive/riji-ui/assets/family-rainy-day.webp`}
              fallbackImage={`${base}assets/projects/riji/side-printing.webp`}
              share={currentShare}
              printRequest={printRequest}
              resetSignal={resetSignal}
              onTakePhoto={takePhoto}
            />
          </Suspense>
        </div>

        <div className={`riji-interface-pane${mobilePanel !== 'model' ? ' is-mobile-active' : ''}`}>
          <div className="riji-interface-head">
            <div><span>02</span><strong>双端交互</strong></div>
            <div className="riji-interface-tabs" role="tablist" aria-label="选择日迹交互端">
              <button id="riji-interface-terminal-tab" type="button" role="tab" aria-selected={interfacePanel === 'terminal'} aria-controls="riji-terminal-panel" onClick={() => chooseInterface('terminal')}>老人终端{unread ? <b aria-label="1条新照片">1</b> : null}</button>
              <button id="riji-interface-mobile-tab" type="button" role="tab" aria-selected={interfacePanel === 'mobile'} aria-controls="riji-mobile-panel" onClick={() => chooseInterface('mobile')}>家人手机</button>
            </div>
          </div>
          <p className="riji-flow-hint" role="status" aria-live="polite">{
            unread
              ? '照片已经送到老人终端，切换过去并点击“打印照片”。'
              : currentShare
                ? `当前已收到“${currentShare.title}”，可以在老人终端打印。`
                : '先切换到“家人手机”，选择一条照片并完成发送。'
          }</p>
          <div className="riji-prototype-stage">
            <div id="riji-terminal-panel" className={`riji-prototype-panel terminal${interfacePanel === 'terminal' ? ' is-active' : ''}`} role="tabpanel" aria-labelledby="riji-terminal-tab riji-interface-terminal-tab">
              <iframe key={`terminal-${prototypeVersion}`} ref={terminalRef} src={`${base}interactive/riji-ui/terminal.html?embedded=1&v=${prototypeVersion}`} title="日迹老人终端交互原型" />
            </div>
            <div id="riji-mobile-panel" className={`riji-prototype-panel mobile${interfacePanel === 'mobile' ? ' is-active' : ''}`} role="tabpanel" aria-labelledby="riji-mobile-tab riji-interface-mobile-tab">
              <iframe key={`mobile-${prototypeVersion}`} ref={mobileRef} src={`${base}interactive/riji-ui/mobile.html?embedded=1&v=${prototypeVersion}`} title="日迹家人手机端交互原型" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
