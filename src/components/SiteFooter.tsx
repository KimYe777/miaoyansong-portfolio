import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer id="contact" className="site-footer">
      <div className="page-shell footer-grid">
        <div className="footer-intro">
          <p className="eyebrow">工业设计作品集 / 2026</p>
          <h2>联系</h2>
        </div>
        <div className="footer-actions">
          <a href="tel:15132632239"><span>电话</span>15132632239</a>
          <a href="mailto:MYS20060412@163.com"><span>邮箱</span>MYS20060412@163.com</a>
        </div>
        <div className="footer-bottom">
          <span>缪岩松 · 工业设计作品集</span>
          <Link to="/">返回作品 ↑</Link>
        </div>
      </div>
    </footer>
  );
}
