import { Link } from 'react-router-dom';
import { ProjectArtwork } from '../components/ProjectArtwork';
import { Reveal } from '../components/Reveal';
import { productProjects, uiProjects, type Project } from '../data/projects';

function FeaturedProject({ project, index }: { project: Project; index: number }) {
  const media = <ProjectArtwork project={project} />;
  const isClearSense = project.slug === 'clearsense';
  const isNightCare = project.slug === 'nightcare';
  const isRiji = project.slug === 'riji';

  return (
    <Reveal className={`featured-project theme-${project.theme} ${index % 2 ? 'layout-reverse' : ''} ${project.reserved ? 'is-reserved-project' : ''}`}>
      {project.reserved ? (
        <div className="featured-media">{media}</div>
      ) : (
        <Link className="featured-media" to={`/work/${project.slug}`} tabIndex={-1} aria-hidden="true">{media}</Link>
      )}
      <div className="featured-copy">
        <div className="project-index-line">
          <span className="project-number">{project.number}</span>
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        {project.reserved ? (
          <span className="pending-detail">等待项目资料</span>
        ) : isClearSense ? (
          <nav className="project-entry-links" aria-label="ClearSense项目浏览入口">
            <Link to="/work/clearsense"><span>查看完整作品集</span><small>12页原稿</small><b aria-hidden="true">↗</b></Link>
            <Link to="/experience/clearsense-model"><span>体验产品模型</span><small>旋转 · 缩放 · 拿起</small><b aria-hidden="true">↗</b></Link>
            <Link to="/experience/clearsense-ui"><span>体验 UI 原型</span><small>在手机模型中操作</small><b aria-hidden="true">↗</b></Link>
          </nav>
        ) : isNightCare ? (
          <nav className="project-entry-links" aria-label="NightCare项目浏览入口">
            <Link to="/work/nightcare"><span>查看完整作品集</span><small>10页原稿</small><b aria-hidden="true">↗</b></Link>
            <Link to="/experience/nightcare"><span>体验模型与终端</span><small>购买 · 开门 · 取货</small><b aria-hidden="true">↗</b></Link>
          </nav>
        ) : isRiji ? (
          <nav className="project-entry-links" aria-label="日迹项目浏览入口">
            <Link to="/work/riji"><span>查看完整作品集</span><small>12页原稿</small><b aria-hidden="true">↗</b></Link>
            <Link to="/experience/riji"><span>体验模型与双端</span><small>发送 · 接收 · 打印</small><b aria-hidden="true">↗</b></Link>
          </nav>
        ) : (
          <Link className="text-link" to={`/work/${project.slug}`}>查看完整作品集 <span aria-hidden="true">↗</span></Link>
        )}
      </div>
    </Reveal>
  );
}

function DigitalProject({ project }: { project: Project }) {
  const experiencePath = project.slug === 'renteye'
    ? '/experience/renteye-ui'
    : '/experience/wander-ui';

  return (
    <Reveal className={`digital-project theme-${project.theme}`}>
      <Link to={`/work/${project.slug}`} className="digital-media" tabIndex={-1} aria-hidden="true">
        <ProjectArtwork project={project} compact />
      </Link>
      <div className="digital-meta">
        <span className="project-number">{project.number}</span>
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.summary}</p>
      <nav className="project-entry-links is-dark" aria-label={`${project.title}项目浏览入口`}>
        <Link to={`/work/${project.slug}`}>
          <span>查看完整作品集</span>
          <small>{project.portfolioPages.length}页原稿</small>
          <b aria-hidden="true">↗</b>
        </Link>
        <Link to={experiencePath}>
          <span>体验 UI 原型</span>
          <small>在手机模型中操作</small>
          <b aria-hidden="true">↗</b>
        </Link>
      </nav>
    </Reveal>
  );
}

export function HomePage() {
  const base = import.meta.env.BASE_URL;

  return (
    <main>
      <section className="home-hero page-shell" aria-labelledby="home-title">
        <div className="hero-status hero-enter hero-enter-1">
          <span>工业设计专业学生</span>
          <span>个人作品集 / 2026</span>
        </div>
        <h1 id="home-title" className="hero-title">
          <span className="hero-line hero-enter hero-enter-2">做产品，</span>
          <span className="hero-line hero-line-indent hero-enter hero-enter-3">也做<em>体验。</em></span>
          <span className="hero-line hero-enter hero-enter-4">从问题到方案</span>
        </h1>
        <div className="hero-foot hero-enter hero-enter-5">
          <p><strong>缪岩松</strong>，工业设计专业本科生。作品涵盖实体产品、服务系统与数字界面。</p>
          <a className="scroll-cue" href="#selected-work">查看作品 <span aria-hidden="true">↓</span></a>
        </div>
        <Link className="hero-project-glimpse hero-enter hero-enter-5" to="/work/clearsense" aria-label="查看ClearSense完整作品集">
          <img src={`${base}assets/projects/clearsense/hero.webp`} alt="" />
          <span>代表项目<br /><strong>ClearSense ↗</strong></span>
        </Link>
        <div className="hero-folio-mark" aria-hidden="true">01—05</div>
      </section>

      <section id="selected-work" className="work-section page-shell section-rule" aria-labelledby="selected-title">
        <Reveal className="section-heading-grid">
          <p className="eyebrow">主要作品 / 产品设计</p>
          <h2 id="selected-title">产品设计作品</h2>
        </Reveal>

        <div className="featured-list">
          {productProjects.filter((project) => !project.reserved).map((project, index) => (
            <FeaturedProject key={project.slug} project={project} index={index} />
          ))}
        </div>
        {productProjects.filter((project) => project.reserved).map((project) => (
          <Reveal className="reserved-project-note" key={project.slug}>
            <span className="project-number">{project.number}</span>
            <div><strong>{project.title}</strong><p>{project.summary}</p></div>
            <span className="pending-detail">资料待补充</span>
          </Reveal>
        ))}
      </section>

      <section className="digital-section" aria-labelledby="digital-title">
        <div className="page-shell">
          <Reveal className="section-heading-grid digital-heading">
            <p className="eyebrow">数字作品 / UI与交互</p>
            <h2 id="digital-title">让复杂判断清楚<br />也让轻松体验自然</h2>
          </Reveal>
          <div className="digital-grid">
            {uiProjects.map((project) => <DigitalProject key={project.slug} project={project} />)}
          </div>
        </div>
      </section>

      <section className="about-preview page-shell section-rule">
        <Reveal className="about-preview-grid">
          <p className="eyebrow">关于我 / 方法</p>
          <blockquote>
            <span className="about-title-kicker">工业设计专业本科生</span>
            <span className="about-title-focus">关注产品与交互体验</span>
          </blockquote>
          <div className="about-preview-copy">
            <Link className="text-link" to="/about">关于我 ↗</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
