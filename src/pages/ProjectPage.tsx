import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PortfolioLightbox } from '../components/PortfolioLightbox';
import { projects, realProjects } from '../data/projects';
import { NotFoundPage } from './NotFoundPage';

export function ProjectPage() {
  const [activePage, setActivePage] = useState<number | null>(null);
  const { slug } = useParams();
  const project = projects.find((item) => item.slug === slug);
  if (!project || project.reserved) return <NotFoundPage />;

  const projectIndex = realProjects.findIndex((item) => item.slug === slug);
  const nextProject = realProjects[(projectIndex + 1) % realProjects.length];
  const totalPages = project.portfolioPages.length;

  return (
    <main className={`portfolio-reader theme-${project.theme}`}>
      <header className="reader-header page-shell">
        <Link className="reader-back" to="/">← 返回全部作品</Link>
        <div className="reader-heading">
          <div>
            <p className="eyebrow">{project.number} / {project.category}</p>
            <h1>{project.title}</h1>
          </div>
          <div className="reader-meta">
            <strong>完整作品集 · 共{totalPages}页</strong>
          </div>
        </div>
      </header>

      <section className="portfolio-pages" aria-label={`${project.title}完整作品集，共${totalPages}页`}>
        {project.portfolioPages.map((page, index) => (
          <figure className="portfolio-page" key={page.src} data-page={index + 1}>
            <button
              className="portfolio-page-open"
              type="button"
              onClick={() => setActivePage(index)}
              aria-label={`放大查看${project.title}作品集第${index + 1}页`}
            >
              <img
                src={page.src}
                alt={page.alt}
                width={page.width}
                height={page.height}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </button>
            <figcaption>第 {String(index + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')} 页</figcaption>
          </figure>
        ))}
      </section>

      {activePage !== null && (
        <PortfolioLightbox
          title={`${project.title}完整作品集`}
          pages={project.portfolioPages}
          activeIndex={activePage}
          onChange={setActivePage}
          onClose={() => setActivePage(null)}
        />
      )}

      <section className="next-project">
        <Link className="page-shell next-project-link" to={`/work/${nextProject.slug}`}>
          <span className="eyebrow">下一个项目 / {nextProject.number}</span>
          <strong>{nextProject.title}</strong>
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
