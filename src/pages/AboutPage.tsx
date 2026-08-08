import { Reveal } from '../components/Reveal';

const portfolioPdfUrl = `${import.meta.env.BASE_URL}assets/documents/portfolio.pdf`;

export function AboutPage() {
  return (
    <main className="about-page page-shell">
      <header className="about-hero">
        <p className="eyebrow hero-enter hero-enter-1">关于我 / 缪岩松</p>
        <h1 className="hero-enter hero-enter-2">
          <span className="about-hero-primary">工业设计，</span>
          <span className="about-hero-accent">也关注交互体验。</span>
        </h1>
      </header>

      <Reveal className="about-facts section-rule">
        <div><span className="eyebrow">教育背景</span><strong>中国地质大学（武汉）</strong><p>工业设计专业 · 本科在读</p></div>
        <div><span className="eyebrow">关注方向</span><strong>产品设计</strong><p>实体产品、服务系统与界面体验</p></div>
        <div><span className="eyebrow">当前状态</span><strong>寻找机会</strong><p>求职投递与学校申请</p></div>
      </Reveal>

      <Reveal className="about-contact section-rule">
        <p className="eyebrow">联系</p>
        <h2>欢迎联系</h2>
        <div className="about-contact-links">
          <a href="tel:15132632239"><span>电话</span><strong>15132632239</strong></a>
          <a href="mailto:MYS20060412@163.com"><span>邮箱</span><strong>MYS20060412@163.com</strong></a>
          <a href={portfolioPdfUrl} target="_blank" rel="noreferrer">
            <span>完整作品集</span>
            <strong>查看 PDF ↗</strong>
          </a>
        </div>
      </Reveal>
    </main>
  );
}
