import { useEffect, useRef, useState } from 'react';
import type { MediaAsset } from '../data/projects';

type PortfolioLightboxProps = {
  title: string;
  pages: MediaAsset[];
  activeIndex: number;
  onChange: (index: number) => void;
  onClose: () => void;
};

export function PortfolioLightbox({ title, pages, activeIndex, onChange, onClose }: PortfolioLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const page = pages[activeIndex];

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    setZoomed(false);
  }, [activeIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onChange((activeIndex - 1 + pages.length) % pages.length);
      if (event.key === 'ArrowRight') onChange((activeIndex + 1) % pages.length);

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, onChange, onClose, pages.length]);

  return (
    <div
      className="portfolio-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      ref={dialogRef}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="lightbox-toolbar">
        <div>
          <strong id="lightbox-title">{title}</strong>
          <span>第 {activeIndex + 1} / {pages.length} 页</span>
        </div>
        <div className="lightbox-actions">
          <button type="button" onClick={() => setZoomed((value) => !value)} aria-pressed={zoomed}>
            {zoomed ? '适合屏幕' : '放大细节'}
          </button>
          <button type="button" onClick={onClose} ref={closeButtonRef} aria-label="关闭大图浏览">关闭 ×</button>
        </div>
      </div>

      <div className={`lightbox-stage ${zoomed ? 'is-zoomed' : ''}`}>
        <img src={page.src} alt={page.alt} width={page.width} height={page.height} />
      </div>

      <div className="lightbox-navigation" aria-label="作品集翻页">
        <button type="button" onClick={() => onChange((activeIndex - 1 + pages.length) % pages.length)}>← 上一页</button>
        <span>可使用键盘方向键翻页</span>
        <button type="button" onClick={() => onChange((activeIndex + 1) % pages.length)}>下一页 →</button>
      </div>
    </div>
  );
}
