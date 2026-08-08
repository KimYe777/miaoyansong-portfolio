import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="not-found page-shell">
      <span className="not-found-code">404</span>
      <div><p className="eyebrow">页面不存在</p><h1>这个项目还没有<br />放进作品集中。</h1><Link className="text-link" to="/">返回作品首页 ←</Link></div>
    </main>
  );
}
