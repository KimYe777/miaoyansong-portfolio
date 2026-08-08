import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header">
      <div className="site-header-inner page-shell">
        <Link className="wordmark" to="/" aria-label="缪岩松，返回首页">
          <span>缪岩松</span>
          <small>工业设计</small>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '关闭' : '菜单'}
        </button>

        <nav id="site-navigation" className={`site-nav ${open ? 'is-open' : ''}`} aria-label="主要导航">
          <NavLink to="/" end>作品</NavLink>
          <NavLink to="/about">关于我</NavLink>
        </nav>
      </div>
    </header>
  );
}
