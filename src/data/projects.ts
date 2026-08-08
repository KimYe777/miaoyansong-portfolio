export type MediaAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Project = {
  slug: string;
  number: string;
  title: string;
  discipline: 'industrial' | 'ui';
  category: string;
  year: string;
  summary: string;
  statement: string;
  theme: 'clearsense' | 'nightcare' | 'riji' | 'renteye' | 'wander' | 'reserved';
  hero?: MediaAsset;
  portfolioPages: MediaAsset[];
  reserved?: boolean;
};

type MediaSize = Pick<MediaAsset, 'width' | 'height'>;
const assetBase = import.meta.env.BASE_URL;

const cover = (project: string, alt: string, size: MediaSize, version = ''): MediaAsset => ({
  src: `${assetBase}assets/portfolio-pages/${project}/page-01.webp${version}`,
  alt,
  ...size,
});

const pageList = (
  project: string,
  count: number,
  title: string,
  size: MediaSize,
  firstPageVersion = '',
  firstPageSize?: MediaSize,
): MediaAsset[] =>
  Array.from({ length: count }, (_, index) => ({
    src: `${assetBase}assets/portfolio-pages/${project}/page-${String(index + 1).padStart(2, '0')}.webp${index === 0 ? firstPageVersion : ''}`,
    alt: `${title}作品集第${index + 1}页，共${count}页`,
    ...(index === 0 && firstPageSize ? firstPageSize : size),
  }));

const clearSenseSize = { width: 1920, height: 1080 };
const nightCareSize = { width: 2400, height: 1350 };
const rentEyeSize = { width: 2160, height: 1380 };
const wanderSize = { width: 2560, height: 1565 };
const wanderCoverSize = { width: 2160, height: 1215 };
const rijiSize = { width: 1192, height: 842 };

export const projects: Project[] = [
  {
    slug: 'clearsense',
    number: '01',
    title: 'ClearSense',
    discipline: 'industrial',
    category: '产品服务系统',
    year: '2026',
    summary: '一套由随身传感器、家庭底座与配套应用组成的个人过敏风险感知系统。',
    statement: '让不可见的环境暴露，变成及时、可理解的行动提示。',
    theme: 'clearsense',
    hero: cover('clearsense', 'ClearSense作品集封面', clearSenseSize),
    portfolioPages: pageList('clearsense', 12, 'ClearSense', clearSenseSize),
  },
  {
    slug: 'nightcare',
    number: '02',
    title: 'NightCare',
    discipline: 'industrial',
    category: '工业设计与服务',
    year: '2026',
    summary: '面向校园夜间健康支持场景的服务终端，围绕判断、获取与安全交付展开。',
    statement: '当校园服务关闭之后，谨慎判断的需求仍然存在。',
    theme: 'nightcare',
    hero: cover('nightcare', 'NightCare作品集封面', nightCareSize),
    portfolioPages: pageList('nightcare', 10, 'NightCare', nightCareSize),
  },
  {
    slug: 'riji',
    number: '03',
    title: '日迹',
    discipline: 'industrial',
    category: '工业设计与交互体验',
    year: '2026',
    summary: '面向异地家庭与居家老人的照片分享终端，让手机里的日常成为可以拿起、收藏与重听的实体记忆。',
    statement: '把家人的每一天，送到老人身边。',
    theme: 'riji',
    hero: cover('riji', '日迹工业设计作品集封面', rijiSize),
    portfolioPages: pageList('riji', 12, '日迹', rijiSize),
  },
  {
    slug: 'renteye',
    number: '04',
    title: '租前眼',
    discipline: 'ui',
    category: 'UI/UX · 决策辅助',
    year: '2026',
    summary: '帮助第一次租房的用户整理房源、现场核查并保留判断依据的决策辅助应用。',
    statement: '不替用户决定，只让决定更有依据。',
    theme: 'renteye',
    hero: cover('renteye', '租前眼UI/UX作品集封面', rentEyeSize),
    portfolioPages: pageList('renteye', 14, '租前眼', rentEyeSize),
  },
  {
    slug: 'wander',
    number: '05',
    title: '出去晃晃',
    discipline: 'ui',
    category: 'UI/UX · AI辅助体验',
    year: '2026',
    summary: '从当下状态出发生成附近路线，陪伴用户完成一次没有明确目的地的轻松散步。',
    statement: '没有明确目的地，也可以出去走一会儿。',
    theme: 'wander',
    hero: cover('wander', '出去晃晃UI/UX作品集封面', wanderCoverSize, '?v=4'),
    portfolioPages: pageList('wander', 15, '出去晃晃', wanderSize, '?v=4', wanderCoverSize),
  },
];

export const productProjects = projects.filter((project) => project.discipline === 'industrial');
export const uiProjects = projects.filter((project) => project.discipline === 'ui');
export const realProjects = projects.filter((project) => !project.reserved);
