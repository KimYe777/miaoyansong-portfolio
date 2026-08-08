import type { Project } from '../data/projects';

type ProjectArtworkProps = {
  project: Project;
  compact?: boolean;
};

export function ProjectArtwork({ project, compact = false }: ProjectArtworkProps) {
  if (!project.hero) {
    return (
      <div className="project-artwork is-reserved" role="img" aria-label="为未来的工业设计项目保留的位置">
        <span className="reserved-cross" aria-hidden="true" />
        <div className="asset-note">
          <span>项目位置已保留</span>
          <strong>第三个产品项目 / 等待完整资料</strong>
        </div>
      </div>
    );
  }

  return (
    <figure className={`project-artwork has-image theme-${project.theme} ${compact ? 'is-compact' : ''}`}>
      <img
        src={project.hero.src}
        alt={project.hero.alt}
        width={project.hero.width}
        height={project.hero.height}
        loading={project.number === '01' ? 'eager' : 'lazy'}
      />
      <figcaption>
        <span>{project.number} / {project.category}</span>
        <strong>{project.statement}</strong>
      </figcaption>
    </figure>
  );
}
